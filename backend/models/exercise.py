from app import db

class Exercise(db.Model):
    __tablename__ = "exercises"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String)
    category = db.Column(db.String)
    muscle_group = db.Column(db.String)
    equipment = db.Column(db.String)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer)
    is_global = db.Column(db.Boolean, default=False)

    user = db.relationship("User", back_populates="exercises")
