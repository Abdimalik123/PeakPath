from app import db
from datetime import datetime

class UserAchievement(db.Model):
    __tablename__ = "user_achievements"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    achievement_type = db.Column(db.String(50))
    achievement_name = db.Column(db.String(200))
    description = db.Column(db.Text)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)
    metadata = db.Column(db.Text)  # Store JSON as text

    # Relationships
    user = db.relationship("User", back_populates="user_achievements")

    def __repr__(self):
        return f"<UserAchievement {self.achievement_name}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'achievement_type': self.achievement_type,
            'achievement_name': self.achievement_name,
            'description': self.description,
            'earned_at': self.earned_at.isoformat() if self.earned_at else None,
            'metadata': self.metadata
        }