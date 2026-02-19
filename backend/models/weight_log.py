from database import db

class WeightLog(db.Model):
    __tablename__ = "weight_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    weight_kg = db.Column(db.Numeric)
    date = db.Column(db.Date)
    created_at = db.Column(db.DateTime)

    user = db.relationship("User", back_populates="weight_logs")
