from database import db
from datetime import datetime

class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = db.Column(db.String)  # friend_request, challenge_invite, pr_achieved, friend_workout, etc.
    message = db.Column(db.Text)
    is_read = db.Column(db.Boolean, default=False)
    priority = db.Column(db.String)  # low, medium, high
    scheduled_for = db.Column(db.DateTime)
    delivered_at = db.Column(db.DateTime)
    read_at = db.Column(db.DateTime)
    entity_type = db.Column(db.String)  # workout, challenge, user, etc.
    entity_id = db.Column(db.Integer)
    action_url = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="notifications")

    __table_args__ = (
        db.Index('idx_notifications_user_read', 'user_id', 'is_read'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'message': self.message,
            'is_read': self.is_read,
            'priority': self.priority,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'action_url': self.action_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None
        }
