from database import db

class WorkoutTemplate(db.Model):
    __tablename__ = "workout_templates"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    name = db.Column(db.String)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime)
    is_system = db.Column(db.Boolean, default=False, nullable=False)
    difficulty = db.Column(db.String(50))
    category = db.Column(db.String(100))
    duration_minutes = db.Column(db.Integer)

    user = db.relationship("User", back_populates="workout_templates")
    exercises = db.relationship("TemplateExercise", back_populates="template", cascade="all, delete-orphan")
