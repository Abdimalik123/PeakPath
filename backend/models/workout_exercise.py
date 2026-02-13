from app import db

class WorkoutExercise(db.Model):
    __tablename__ = "workout_exercises"

    id = db.Column(db.Integer, primary_key=True)
    workout_id = db.Column(db.Integer, db.ForeignKey("workouts.id", ondelete="CASCADE"), nullable=False)
    exercise_id = db.Column(db.Integer, db.ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False)
    sets = db.Column(db.Integer)
    reps = db.Column(db.Integer)
    weight = db.Column(db.Numeric)
    duration = db.Column(db.Integer)
    rest_time = db.Column(db.Integer)
    notes = db.Column(db.Text)

    workout = db.relationship("Workout", back_populates="exercises")
    exercise = db.relationship("Exercise")
