from database import db
from datetime import datetime

class NutritionLog(db.Model):
    __tablename__ = "nutrition_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    meal_type = db.Column(db.String)
    description = db.Column(db.Text)
    calories = db.Column(db.Integer)
    protein = db.Column(db.Numeric)
    carbs = db.Column(db.Numeric)
    fats = db.Column(db.Numeric)
    date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User")
