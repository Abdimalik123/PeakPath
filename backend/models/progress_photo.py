from database import db
from datetime import datetime

class ProgressPhoto(db.Model):
    __tablename__ = "progress_photos"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    photo_url = db.Column(db.String(500), nullable=False)
    photo_type = db.Column(db.String(20), default='front')  # front, side, back, other
    photo_date = db.Column(db.Date, nullable=False)
    weight = db.Column(db.Float)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="progress_photos")

    def __repr__(self):
        return f"<ProgressPhoto {self.user_id} - {self.photo_date}>"
