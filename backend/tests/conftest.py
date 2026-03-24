"""
conftest.py - Shared pytest fixtures for the Uptrakk Flask backend test suite.

Design decisions:
- Uses SQLite in-memory database so no PostgreSQL instance is required.
- The `create_app` factory is patched via environment variables before import so
  that the mandatory DB_PASSWORD guard and SECRET_KEY guard do not raise.
- All gamification side-effects (rewards, PR tracking, activity logging) are
  patched at the module level for every test, keeping each test focused on the
  behaviour under test rather than its transitive dependencies.
- Fixtures are function-scoped by default so each test starts with a clean DB.

SQLite compatibility note:
  The Exercise model defines a functional unique index using db.func.lower().
  While SQLite 3.9+ supports expression indexes, the SQLAlchemy dialect emits
  DDL that SQLite silently ignores for functional indexes — so create_all()
  will succeed but the uniqueness is not enforced in tests.  This is acceptable
  because we are testing application logic, not the database's index behaviour.
"""

import os
import sys
import datetime
import pytest
import jwt
from unittest.mock import patch, MagicMock

# ---------------------------------------------------------------------------
# Ensure the backend directory is on sys.path so modules can be found.
# ---------------------------------------------------------------------------
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

# ---------------------------------------------------------------------------
# Set required environment variables BEFORE any application code is imported.
# This prevents the module-level guard in auth.py and app.py from raising.
# ---------------------------------------------------------------------------
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("DB_PASSWORD", "test-password-ignored-for-sqlite")
os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("DB_USERNAME", "test_user")


# ---------------------------------------------------------------------------
# Import modules first, then patch their attributes.
# The modules must be importable before patch() can target them.
# ---------------------------------------------------------------------------
import utils.gamification_helper  # noqa: E402
import utils.goal_sync  # noqa: E402
import utils.notifications  # noqa: E402
import utils.social_helpers  # noqa: E402

_global_patches = [
    patch("utils.gamification_helper.award_points", return_value={"leveled_up": False}),
    patch("utils.gamification_helper.check_workout_achievements", return_value=[]),
    patch("utils.gamification_helper.check_habit_achievements", return_value=[]),
    patch("utils.gamification_helper.check_goal_achievements", return_value=[]),
    patch("utils.goal_sync.sync_goal_progress", return_value=[]),
    patch("utils.notifications.notify_achievement"),
    patch("utils.notifications.notify_level_up"),
    patch("utils.notifications.notify_goal_completed"),
    patch("utils.notifications.notify_goal_progress"),
    patch("utils.notifications.notify_points_earned"),
    patch("utils.social_helpers.create_workout_activity"),
    patch("utils.social_helpers.create_habit_activity"),
    patch("utils.social_helpers.create_goal_activity"),
]

for p in _global_patches:
    p.start()

# Now it is safe to import application code.
from app import create_app  # noqa: E402  (import after env setup)
from database import db as _db, limiter as _limiter  # noqa: E402


# ---------------------------------------------------------------------------
# Application fixture
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def app():
    """
    Create a Flask application configured for testing with an in-memory SQLite
    database.  Scoped to the session so the app is only built once.
    """
    test_app = create_app()

    # Override config before any DB operations occur.
    test_app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///:memory:"
    test_app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {}
    test_app.config['TESTING'] = True
    test_app.config['RATELIMIT_ENABLED'] = False
    test_app.config['RATELIMIT_STORAGE_URI'] = "memory://"
    test_app.config['SECRET_KEY'] = "test-secret-key-not-for-production"

    # Disable rate limiting for tests
    _limiter.enabled = False

    # Replace the cached PostgreSQL engine with one using the SQLite URI.
    with test_app.app_context():
        if test_app in _db._app_engines:
            # Dispose old PostgreSQL engine and replace with SQLite engine
            for key, engine in _db._app_engines[test_app].items():
                engine.dispose()
            _db._app_engines[test_app].clear()

        # Use StaticPool so all connections share the same in-memory DB
        from sqlalchemy import create_engine
        from sqlalchemy.pool import StaticPool
        _db._app_engines[test_app] = {
            None: create_engine(
                "sqlite:///:memory:",
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
            )
        }

    with test_app.app_context():
        # Import every model so SQLAlchemy's metadata is fully populated before
        # create_all() is called.  The app factory already does this inside its
        # own context, but session-scoped fixtures run before the first request
        # context so we re-import here to be safe.
        from models import (  # noqa: F401
            User, UserProfile, WeightLog, Workout, Exercise,
            WorkoutExercise, WorkoutTemplate, TemplateExercise,
            Habit, HabitLog, Goal, GoalLink, NutritionLog,
            Notification, ActivityLog, UserPoint, UserAchievement,
            PointTransaction, Friendship, SocialActivity, ActivityLike,
            ActivityComment, ProgressPhoto, BodyMeasurement, StreakFreeze,
        )
        from models.personal_record import PersonalRecord  # noqa: F401
        from models.group import Group, GroupMember, GroupPost  # noqa: F401
        from models.message import Conversation, Message  # noqa: F401
        from models.activity_reaction import ActivityReaction  # noqa: F401
        from models.workout_program import (  # noqa: F401
            WorkoutProgram, ProgramWorkout, ProgramExercise, ProgramEnrollment,
        )
        from models.cardio_workout import CardioWorkout  # noqa: F401
        from models.scheduled_workout import ScheduledWorkout  # noqa: F401

        _db.create_all()
        yield test_app
        _db.drop_all()


@pytest.fixture(scope="function")
def db(app):
    """
    Provide a clean database for each test.  Uses a simple approach:
    yield the db object, then remove the session and delete all data.
    """
    yield _db

    _db.session.remove()
    # Clean all tables after each test
    meta = _db.metadata
    with app.app_context():
        for table in reversed(meta.sorted_tables):
            _db.session.execute(table.delete())
        _db.session.commit()


# ---------------------------------------------------------------------------
# HTTP client fixture
# ---------------------------------------------------------------------------

@pytest.fixture(scope="function")
def client(app):
    """Standard Flask test client (no authentication)."""
    return app.test_client()


# ---------------------------------------------------------------------------
# JWT / authentication helpers
# ---------------------------------------------------------------------------

SECRET_KEY = "test-secret-key-not-for-production"


def _make_token(user_id: int, firstname: str = "Test", lastname: str = "User",
                email: str = "test@example.com", expired: bool = False) -> str:
    """Encode a JWT with the test secret key."""
    exp_delta = datetime.timedelta(seconds=-1) if expired else datetime.timedelta(days=1)
    payload = {
        "id": user_id,
        "firstname": firstname,
        "lastname": lastname,
        "email": email,
        "exp": datetime.datetime.utcnow() + exp_delta,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


@pytest.fixture(scope="function")
def auth_headers(db):
    """
    Create a real User row in the DB and return HTTP headers that carry a
    valid JWT for that user.  The token is signed with the same SECRET_KEY
    that the application uses during tests.
    """
    from models import User
    from werkzeug.security import generate_password_hash

    user = User(
        firstname="Test",
        lastname="User",
        email="testuser@example.com",
        password_hash=generate_password_hash("TestPass123!"),
    )
    db.session.add(user)
    db.session.commit()

    token = _make_token(
        user_id=user.id,
        firstname=user.firstname,
        lastname=user.lastname,
        email=user.email,
    )
    return {"Authorization": f"Bearer {token}", "_user_id": user.id}


@pytest.fixture(scope="function")
def auth_user(db):
    """
    Return a (user, token) tuple so tests that need direct ORM access to the
    user object as well as the JWT can destructure it easily.
    """
    from models import User
    from werkzeug.security import generate_password_hash

    user = User(
        firstname="Auth",
        lastname="User",
        email="authuser@example.com",
        password_hash=generate_password_hash("AuthPass456!"),
    )
    db.session.add(user)
    db.session.commit()

    token = _make_token(
        user_id=user.id,
        firstname=user.firstname,
        lastname=user.lastname,
        email=user.email,
    )
    return user, token


# ---------------------------------------------------------------------------
# Common model factory helpers (not full factory-boy; kept simple on purpose)
# ---------------------------------------------------------------------------

@pytest.fixture(scope="function")
def make_workout(db, auth_headers):
    """
    Factory fixture: call make_workout(**kwargs) inside a test to insert a
    Workout row owned by the auth_headers user.  Returns the committed ORM obj.
    """
    from models import Workout
    import datetime as dt

    def _factory(
        workout_type="Strength",
        duration=60,
        date=None,
        notes=None,
        rpe=None,
        user_id=None,
    ):
        workout = Workout(
            user_id=user_id or auth_headers["_user_id"],
            type=workout_type,
            duration=duration,
            date=date or dt.date.today(),
            notes=notes,
            rpe=rpe,
        )
        db.session.add(workout)
        db.session.commit()
        return workout

    return _factory


@pytest.fixture(scope="function")
def make_user(db):
    """Factory: create an additional User row with auto-generated unique email."""
    from models import User
    from werkzeug.security import generate_password_hash

    counter = {"n": 0}

    def _factory(firstname="Extra", lastname="User", password="Pass123!"):
        counter["n"] += 1
        email = f"extra_user_{counter['n']}@example.com"
        user = User(
            firstname=firstname,
            lastname=lastname,
            email=email,
            password_hash=generate_password_hash(password),
        )
        db.session.add(user)
        db.session.commit()
        return user

    return _factory
