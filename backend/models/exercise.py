from database import db

class Exercise(db.Model):
    __tablename__ = "exercises"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    category = db.Column(db.String(100))
    muscle_group = db.Column(db.String, index=True)
    equipment = db.Column(db.String, index=True)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer)
    is_global = db.Column(db.Boolean, default=False, index=True)

    user = db.relationship("User", back_populates="exercises")

    __table_args__ = (
        db.Index('idx_exercise_user_name', 'user_id', 'name'),
        db.Index('unique_exercise_name_ci', db.func.lower(name), unique=True),
    )
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "muscle_group": self.muscle_group,
            "equipment": self.equipment,
            "description": self.description,
            "is_global": self.is_global
        }
    