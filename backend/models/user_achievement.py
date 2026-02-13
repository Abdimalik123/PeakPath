from app import db
from datetime import datetime

class UserAchievement(db.Model):
    __tablename__ = "user_achievements"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    achievement_type = db.Column(db.String)
    achievement_name = db.Column(db.String)
    description = db.Column(db.Text)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)
    metadata_json = db.Column('metadata', db.Text)

    user = db.relationship("User", back_populates="user_achievements")
