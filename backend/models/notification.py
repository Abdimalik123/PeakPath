from database import db
from datetime import datetime

class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = db.Column(db.String)
    message = db.Column(db.Text)
    is_read = db.Column(db.Boolean, default=False)
    priority = db.Column(db.String)
    scheduled_for = db.Column(db.DateTime)
    delivered_at = db.Column(db.DateTime)
    read_at = db.Column(db.DateTime)

    user = db.relationship("User", back_populates="notifications")
