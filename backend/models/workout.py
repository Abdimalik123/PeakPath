from database import db
from datetime import datetime

class Workout(db.Model):
    __tablename__ = "workouts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = db.Column(db.String(100))
    duration = db.Column(db.Integer)  # in minutes
    date = db.Column(db.Date, index=True)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship("User", back_populates="workouts")
    exercises = db.relationship("WorkoutExercise", back_populates="workout", cascade="all, delete-orphan", lazy='dynamic')

    # Composite index for common queries
    __table_args__ = (
        db.Index('idx_workouts_user_date', 'user_id', 'date'),
    )

    def __repr__(self):
        return f"<Workout {self.type} on {self.date}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'duration': self.duration,
            'date': self.date.isoformat() if self.date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }