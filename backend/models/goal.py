from app import db
from datetime import datetime

class Goal(db.Model):
    __tablename__ = "goals"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String)
    type = db.Column(db.String)
    target = db.Column(db.Integer)
    progress = db.Column(db.Integer)
    deadline = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    auto_sync = db.Column(db.Boolean, default=False)

    user = db.relationship("User", back_populates="goals")
    goal_links = db.relationship("GoalLink", back_populates="goal", cascade="all, delete-orphan")
