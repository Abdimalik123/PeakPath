from app import db
from datetime import datetime

class Habit(db.Model):
    __tablename__ = "habits"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String)
    frequency = db.Column(db.String)
    reminder_time = db.Column(db.Time)
    description = db.Column(db.Text)
    next_occurrence = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", back_populates="habits")
    logs = db.relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan")
