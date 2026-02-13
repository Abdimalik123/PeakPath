from app import db
from datetime import datetime

class UserPoint(db.Model):
    __tablename__ = "user_points"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    total_points = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    points_to_next_level = db.Column(db.Integer, default=100)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", back_populates="user_points")
