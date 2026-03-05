from database import db
from datetime import datetime

class PersonalRecord(db.Model):
    __tablename__ = "personal_records"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    exercise_id = db.Column(db.Integer, db.ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False)
    
    # PR metrics
    max_weight = db.Column(db.Float)  # Heaviest weight lifted
    max_reps = db.Column(db.Integer)  # Most reps in a single set
    max_volume = db.Column(db.Float)  # Highest total volume (sets × reps × weight)
    best_one_rep_max = db.Column(db.Float)  # Calculated 1RM
    
    # Reference to the workout where PR was achieved
    workout_id = db.Column(db.Integer, db.ForeignKey("workouts.id", ondelete="SET NULL"))
    workout_exercise_id = db.Column(db.Integer, db.ForeignKey("workout_exercises.id", ondelete="SET NULL"))
    
    achieved_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship("User", backref="personal_records")
    exercise = db.relationship("Exercise", backref="personal_records")
    workout = db.relationship("Workout", backref="personal_records")

    __table_args__ = (
        db.Index('idx_pr_user_exercise', 'user_id', 'exercise_id'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'exercise_id': self.exercise_id,
            'max_weight': float(self.max_weight) if self.max_weight else None,
            'max_reps': self.max_reps,
            'max_volume': float(self.max_volume) if self.max_volume else None,
            'best_one_rep_max': float(self.best_one_rep_max) if self.best_one_rep_max else None,
            'workout_id': self.workout_id,
            'achieved_at': self.achieved_at.isoformat() if self.achieved_at else None
        }
