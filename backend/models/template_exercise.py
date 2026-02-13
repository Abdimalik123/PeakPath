from app import db

class TemplateExercise(db.Model):
    __tablename__ = "template_exercises"

    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey("workout_templates.id", ondelete="CASCADE"), nullable=False)
    exercise_id = db.Column(db.Integer, db.ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False)
    sets = db.Column(db.Integer)
    reps = db.Column(db.Integer)
    weight = db.Column(db.Numeric)
    duration = db.Column(db.Integer)
    rest_time = db.Column(db.Integer)
    order_index = db.Column(db.Integer)
    notes = db.Column(db.Text)

    template = db.relationship("WorkoutTemplate", back_populates="exercises")
    exercise = db.relationship("Exercise")
