from database import db
from datetime import datetime


class CardioWorkout(db.Model):
    __tablename__ = 'cardio_workouts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    cardio_type = db.Column(db.String(50), nullable=False)  # running, cycling, swimming, rowing, walking
    distance = db.Column(db.Float)  # in kilometers
    duration = db.Column(db.Integer)  # in minutes
    pace = db.Column(db.Float)  # min/km
    calories = db.Column(db.Integer)
    heart_rate_avg = db.Column(db.Integer)
    heart_rate_max = db.Column(db.Integer)
    elevation_gain = db.Column(db.Float)  # in meters
    notes = db.Column(db.Text)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='cardio_workouts')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'cardio_type': self.cardio_type,
            'distance': float(self.distance) if self.distance else None,
            'duration': self.duration,
            'pace': float(self.pace) if self.pace else None,
            'calories': self.calories,
            'heart_rate_avg': self.heart_rate_avg,
            'heart_rate_max': self.heart_rate_max,
            'elevation_gain': float(self.elevation_gain) if self.elevation_gain else None,
            'notes': self.notes,
            'date': self.date.isoformat() if self.date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
