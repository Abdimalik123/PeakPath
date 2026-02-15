from app import db
from datetime import datetime

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    firstname = db.Column(db.Text)
    lastname = db.Column(db.Text)

    profiles = db.relationship("UserProfile", back_populates="user", cascade="all, delete-orphan")
    workouts = db.relationship("Workout", back_populates="user", cascade="all, delete-orphan")
    exercises = db.relationship("Exercise", back_populates="user", cascade="all, delete-orphan")
    weight_logs = db.relationship("WeightLog", back_populates="user", cascade="all, delete-orphan")
    habits = db.relationship("Habit", back_populates="user", cascade="all, delete-orphan")
    goals = db.relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    notifications = db.relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    activity_logs = db.relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")
    workout_templates = db.relationship("WorkoutTemplate", back_populates="user", cascade="all, delete-orphan")
    user_points = db.relationship("UserPoint", back_populates="user", uselist=False, cascade="all, delete-orphan")
    user_achievements = db.relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")
    point_transactions = db.relationship("PointTransaction", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"