from app import db
from datetime import datetime

class HabitLog(db.Model):
    __tablename__ = "habit_logs"

    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey("habits.id", ondelete="CASCADE"), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    amount = db.Column(db.Numeric(6,2))
    notes = db.Column(db.Text)
    completed = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    habit = db.relationship("Habit", back_populates="logs")
