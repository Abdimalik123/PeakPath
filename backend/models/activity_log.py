from database import db
from datetime import datetime

class ActivityLog(db.Model):
    __tablename__ = "activity_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action = db.Column(db.String)
    entity_type = db.Column(db.String)
    entity_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="activity_logs")

    __table_args__ = (
        db.Index('idx_activity_logs_user_created', 'user_id', 'created_at'),
    )
