from app import db

class Workout(db.Model):
    __tablename__ = "workouts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = db.Column(db.String)
    duration = db.Column(db.Integer)
    date = db.Column(db.Date)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime)

    user = db.relationship("User", back_populates="workouts")
    exercises = db.relationship("WorkoutExercise", back_populates="workout", cascade="all, delete-orphan")
