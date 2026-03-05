from database import db
from datetime import datetime


class ScheduledWorkout(db.Model):
    __tablename__ = 'scheduled_workouts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    scheduled_date = db.Column(db.Date, nullable=False, index=True)
    scheduled_time = db.Column(db.String(10))  # "09:00" format
    workout_type = db.Column(db.String(100))
    duration_planned = db.Column(db.Integer)  # planned minutes
    notes = db.Column(db.Text)
    completed = db.Column(db.Boolean, default=False)
    workout_id = db.Column(db.Integer, db.ForeignKey('workouts.id', ondelete='SET NULL'))  # linked actual workout
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='scheduled_workouts')

    __table_args__ = (
        db.Index('idx_scheduled_user_date', 'user_id', 'scheduled_date'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'scheduled_time': self.scheduled_time,
            'workout_type': self.workout_type,
            'duration_planned': self.duration_planned,
            'notes': self.notes,
            'completed': self.completed,
            'workout_id': self.workout_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
