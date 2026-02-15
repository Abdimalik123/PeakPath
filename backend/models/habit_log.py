from app import db
from datetime import datetime

class HabitLog(db.Model):
    __tablename__ = "habit_logs"

    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey("habits.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    amount = db.Column(db.Numeric(6, 2))  # Optional quantity (e.g., ml, minutes)
    notes = db.Column(db.Text)
    completed = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    habit = db.relationship("Habit", back_populates="logs")

    def __repr__(self):
        return f"<HabitLog habit_id={self.habit_id} at {self.timestamp}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'habit_id': self.habit_id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'amount': float(self.amount) if self.amount else None,
            'notes': self.notes,
            'completed': self.completed
        }