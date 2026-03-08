"""
test_auth.py - Tests for backend/api/auth.py

Coverage targets:
  POST /api/v1/register   - happy path, duplicate email, missing fields,
                            password mismatch
  POST /api/v1/login      - happy path, wrong password, unknown email,
                            missing fields
  GET  /api/v1/me         - valid token, expired token, missing token,
                            malformed token, user deleted after token issued
  login_required decorator - all guard branches exercised independently
"""

import datetime
import jwt
import pytest
from unittest.mock import patch
from werkzeug.security import generate_password_hash

SECRET_KEY = "test-secret-key-not-for-production"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _valid_register_payload(**overrides):
    base = {
        "firstname": "Jane",
        "lastname": "Doe",
        "email": "jane.doe@example.com",
        "password": "Secure123!",
        "confirm_password": "Secure123!",
    }
    base.update(overrides)
    return base


def _make_expired_token(user_id: int) -> str:
    payload = {
        "id": user_id,
        "firstname": "Jane",
        "lastname": "Doe",
        "email": "jane@example.com",
        "exp": datetime.datetime.utcnow() - datetime.timedelta(seconds=10),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def _make_token_wrong_key(user_id: int) -> str:
    payload = {
        "id": user_id,
        "firstname": "Jane",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1),
    }
    return jwt.encode(payload, "completely-wrong-secret", algorithm="HS256")


# ---------------------------------------------------------------------------
# POST /api/v1/register
# ---------------------------------------------------------------------------

class TestRegister:
    """Registration endpoint tests."""

    def test_successful_registration_returns_201_with_token(self, client, db):
        """Happy path: new user gets a 201 with a JWT and user details."""
        payload = _valid_register_payload()

        resp = client.post("/api/v1/register", json=payload)

        assert resp.status_code == 201
        data = resp.get_json()
        assert data["success"] is True
        assert "token" in data
        assert data["user"]["email"] == payload["email"]
        assert data["user"]["firstname"] == payload["firstname"]
        assert data["user"]["lastname"] == payload["lastname"]
        # token should decode cleanly with the test key
        decoded = jwt.decode(data["token"], SECRET_KEY, algorithms=["HS256"])
        assert decoded["email"] == payload["email"]

    def test_register_returns_user_id(self, client, db):
        """Response must include user_id for downstream use."""
        resp = client.post("/api/v1/register", json=_valid_register_payload())
        data = resp.get_json()
        assert "user_id" in data
        assert isinstance(data["user_id"], int)

    def test_duplicate_email_returns_400(self, client, db):
        """Registering the same email twice must be rejected."""
        payload = _valid_register_payload()
        client.post("/api/v1/register", json=payload)  # first registration

        resp = client.post("/api/v1/register", json=payload)

        assert resp.status_code == 400
        data = resp.get_json()
        assert data["success"] is False
        assert "already exists" in data["message"].lower()

    @pytest.mark.parametrize("missing_field", [
        "firstname", "lastname", "email", "password", "confirm_password"
    ])
    def test_missing_required_field_returns_400(self, client, db, missing_field):
        """Each required field, when absent, causes a 400 with a useful message."""
        payload = _valid_register_payload()
        del payload[missing_field]

        resp = client.post("/api/v1/register", json=payload)

        assert resp.status_code == 400
        data = resp.get_json()
        assert data["success"] is False
        assert missing_field in data["message"]

    def test_password_mismatch_returns_400(self, client, db):
        """confirm_password not matching password must be rejected."""
        payload = _valid_register_payload(confirm_password="WrongPassword!")

        resp = client.post("/api/v1/register", json=payload)

        assert resp.status_code == 400
        data = resp.get_json()
        assert data["success"] is False
        assert "match" in data["message"].lower()

    def test_register_persists_user_in_database(self, client, db):
        """After successful registration, the user row must exist in the DB."""
        from models import User

        payload = _valid_register_payload(email="persisted@example.com")
        client.post("/api/v1/register", json=payload)

        user = User.query.filter_by(email="persisted@example.com").first()
        assert user is not None
        assert user.firstname == payload["firstname"]

    def test_register_password_is_hashed_not_stored_plaintext(self, client, db):
        """The stored password_hash must NOT equal the plaintext password."""
        from models import User

        payload = _valid_register_payload(email="hashcheck@example.com")
        client.post("/api/v1/register", json=payload)

        user = User.query.filter_by(email="hashcheck@example.com").first()
        assert user.password_hash != payload["password"]
        # Must be verifiable via werkzeug
        from werkzeug.security import check_password_hash
        assert check_password_hash(user.password_hash, payload["password"])

    def test_register_with_empty_json_body_returns_400(self, client, db):
        """An empty JSON body should trigger missing-field validation."""
        resp = client.post("/api/v1/register", json={})
        assert resp.status_code == 400
        assert resp.get_json()["success"] is False


# ---------------------------------------------------------------------------
# POST /api/v1/login
# ---------------------------------------------------------------------------

class TestLogin:
    """Login endpoint tests."""

    @pytest.fixture(autouse=True)
    def _seed_user(self, db):
        """Insert a known user before each login test."""
        from models import User
        user = User(
            firstname="Login",
            lastname="Tester",
            email="login@example.com",
            password_hash=generate_password_hash("CorrectPass1!"),
        )
        db.session.add(user)
        db.session.commit()
        self.user = user

    def test_successful_login_returns_200_with_token(self, client):
        """Correct credentials produce a 200 with a valid JWT."""
        resp = client.post(
            "/api/v1/login",
            json={"email": "login@example.com", "password": "CorrectPass1!"},
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        assert "token" in data
        decoded = jwt.decode(data["token"], SECRET_KEY, algorithms=["HS256"])
        assert decoded["id"] == self.user.id

    def test_login_response_contains_user_details(self, client):
        """Login response body must include firstname, lastname, email, id."""
        resp = client.post(
            "/api/v1/login",
            json={"email": "login@example.com", "password": "CorrectPass1!"},
        )
        user_data = resp.get_json()["user"]
        assert user_data["email"] == "login@example.com"
        assert user_data["firstname"] == "Login"
        assert user_data["lastname"] == "Tester"
        assert "id" in user_data

    def test_wrong_password_returns_401(self, client):
        """A known user with the wrong password must be rejected with 401."""
        resp = client.post(
            "/api/v1/login",
            json={"email": "login@example.com", "password": "WrongPass!"},
        )

        assert resp.status_code == 401
        data = resp.get_json()
        assert data["success"] is False
        assert "incorrect" in data["message"].lower()

    def test_nonexistent_email_returns_404(self, client):
        """An email that was never registered should produce a 404."""
        resp = client.post(
            "/api/v1/login",
            json={"email": "ghost@example.com", "password": "SomePass1!"},
        )

        assert resp.status_code == 404
        data = resp.get_json()
        assert data["success"] is False

    def test_missing_email_returns_400(self, client):
        resp = client.post("/api/v1/login", json={"password": "CorrectPass1!"})
        assert resp.status_code == 400
        assert resp.get_json()["success"] is False

    def test_missing_password_returns_400(self, client):
        resp = client.post("/api/v1/login", json={"email": "login@example.com"})
        assert resp.status_code == 400
        assert resp.get_json()["success"] is False

    def test_login_with_empty_body_returns_400(self, client):
        resp = client.post("/api/v1/login", json={})
        assert resp.status_code == 400
        assert resp.get_json()["success"] is False

    def test_token_expiry_is_set_to_one_day(self, client):
        """The issued token's 'exp' claim should be approximately 24 h from now."""
        resp = client.post(
            "/api/v1/login",
            json={"email": "login@example.com", "password": "CorrectPass1!"},
        )
        token = resp.get_json()["token"]
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        exp = datetime.datetime.utcfromtimestamp(decoded["exp"])
        now = datetime.datetime.utcnow()
        delta = exp - now
        # Allow 5 minutes of clock drift either direction around 24 h
        assert datetime.timedelta(hours=23, minutes=55) < delta < datetime.timedelta(hours=24, minutes=5)


# ---------------------------------------------------------------------------
# GET /api/v1/me  (requires login_required)
# ---------------------------------------------------------------------------

class TestGetCurrentUser:
    """Tests for the /me endpoint and the login_required decorator."""

    def test_valid_token_returns_user_info(self, client, auth_headers, db):
        """A properly signed token returns the authenticated user's details."""
        resp = client.get(
            "/api/v1/me",
            headers={"Authorization": auth_headers["Authorization"]},
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        assert "user" in data
        user = data["user"]
        assert user["email"] == "testuser@example.com"
        assert "id" in user

    def test_missing_authorization_header_returns_401(self, client):
        """A request with no Authorization header must be rejected."""
        resp = client.get("/api/v1/me")
        assert resp.status_code == 401
        data = resp.get_json()
        assert data["success"] is False

    def test_bearer_prefix_required(self, client, auth_headers):
        """A token without the 'Bearer ' prefix must be rejected."""
        raw_token = auth_headers["Authorization"].split(" ")[1]
        resp = client.get("/api/v1/me", headers={"Authorization": raw_token})
        assert resp.status_code == 401

    def test_expired_token_returns_401(self, client, db):
        """An expired JWT must be rejected with a clear error."""
        from models import User

        user = User(
            firstname="Expired",
            lastname="Token",
            email="expired@example.com",
            password_hash=generate_password_hash("pass"),
        )
        db.session.add(user)
        db.session.commit()

        token = _make_expired_token(user.id)
        resp = client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})

        assert resp.status_code == 401
        data = resp.get_json()
        assert data["success"] is False
        assert "expired" in data.get("message", "").lower()

    def test_token_signed_with_wrong_key_returns_401(self, client, db):
        """A token signed with a different secret must be rejected."""
        token = _make_token_wrong_key(user_id=999)
        resp = client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})

        assert resp.status_code == 401
        data = resp.get_json()
        assert data["success"] is False

    def test_completely_garbage_token_returns_401(self, client):
        """An arbitrary non-JWT string in the Authorization header must be rejected."""
        resp = client.get("/api/v1/me", headers={"Authorization": "Bearer not.a.real.token"})
        assert resp.status_code == 401

    def test_user_deleted_after_token_issued_returns_404(self, client, db):
        """If the user was deleted after their token was minted, /me returns 404."""
        from models import User

        user = User(
            firstname="Gone",
            lastname="User",
            email="gone@example.com",
            password_hash=generate_password_hash("pass"),
        )
        db.session.add(user)
        db.session.commit()

        token = jwt.encode(
            {
                "id": user.id,
                "firstname": user.firstname,
                "lastname": user.lastname,
                "email": user.email,
                "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1),
            },
            SECRET_KEY,
            algorithm="HS256",
        )

        # Delete the user from the database before making the request.
        db.session.delete(user)
        db.session.commit()

        resp = client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 404
        data = resp.get_json()
        assert data["success"] is False


# ---------------------------------------------------------------------------
# login_required decorator — unit-level coverage
# ---------------------------------------------------------------------------

class TestLoginRequiredDecorator:
    """
    These tests drive the decorator through a minimal protected endpoint
    (/api/v1/me) rather than testing the decorator function directly, because
    the decorator's logic lives entirely in the request context.
    """

    def test_authorization_header_empty_string_rejected(self, client):
        resp = client.get("/api/v1/me", headers={"Authorization": ""})
        assert resp.status_code == 401

    def test_authorization_header_with_only_bearer_keyword_rejected(self, client):
        """'Bearer ' with no token string must be caught."""
        # Split logic: auth_header.split(" ")[1] would give '' which jwt.decode rejects
        resp = client.get("/api/v1/me", headers={"Authorization": "Bearer "})
        assert resp.status_code == 401

    def test_token_payload_is_attached_to_g(self, client, auth_headers):
        """
        Verify indirectly: the /me endpoint reads g.user['id'], so if the
        decorator did NOT attach the payload the endpoint would crash with 500.
        A 200 proves attachment happened correctly.
        """
        resp = client.get(
            "/api/v1/me",
            headers={"Authorization": auth_headers["Authorization"]},
        )
        assert resp.status_code == 200
