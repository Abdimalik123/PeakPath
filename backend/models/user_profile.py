from database import db
from datetime import datetime

class UserProfile(db.Model):
    __tablename__ = "user_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    age = db.Column(db.Integer)
    gender = db.Column(db.String)
    height_cm = db.Column(db.Numeric)
    current_weight_kg = db.Column(db.Numeric)
    goal_weight_kg = db.Column(db.Numeric)
    activity_level = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", back_populates="profiles")
