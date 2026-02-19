from database import db
from datetime import datetime

class GoalLink(db.Model):
    __tablename__ = "goal_links"

    id = db.Column(db.Integer, primary_key=True)
    goal_id = db.Column(db.Integer, db.ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)
    entity_type = db.Column(db.String)
    entity_id = db.Column(db.Integer)
    linked_workout_type = db.Column(db.String)
    contribution_value = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    goal = db.relationship("Goal", back_populates="goal_links")
