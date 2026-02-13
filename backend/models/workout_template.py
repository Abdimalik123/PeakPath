from app import db

class WorkoutTemplate(db.Model):
    __tablename__ = "workout_templates"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime)

    user = db.relationship("User", back_populates="workout_templates")
    exercises = db.relationship("TemplateExercise", back_populates="template", cascade="all, delete-orphan")
