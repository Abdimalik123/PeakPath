from database import db
from datetime import datetime

class BodyMeasurement(db.Model):
    __tablename__ = "body_measurements"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Weight tracking
    weight_kg = db.Column(db.Float, nullable=False)
    
    # Body measurements (optional, all in cm)
    chest = db.Column(db.Float)
    waist = db.Column(db.Float)
    hips = db.Column(db.Float)
    bicep_left = db.Column(db.Float)
    bicep_right = db.Column(db.Float)
    thigh_left = db.Column(db.Float)
    thigh_right = db.Column(db.Float)
    calf_left = db.Column(db.Float)
    calf_right = db.Column(db.Float)
    neck = db.Column(db.Float)
    shoulders = db.Column(db.Float)
    
    # Body composition (optional)
    body_fat_percentage = db.Column(db.Float)
    
    # Notes and date
    notes = db.Column(db.Text)
    measured_at = db.Column(db.Date, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship("User", backref="body_measurements")

    # Composite index for common queries
    __table_args__ = (
        db.Index('idx_measurements_user_date', 'user_id', 'measured_at'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'weight_kg': float(self.weight_kg) if self.weight_kg else None,
            'chest': float(self.chest) if self.chest else None,
            'waist': float(self.waist) if self.waist else None,
            'hips': float(self.hips) if self.hips else None,
            'bicep_left': float(self.bicep_left) if self.bicep_left else None,
            'bicep_right': float(self.bicep_right) if self.bicep_right else None,
            'thigh_left': float(self.thigh_left) if self.thigh_left else None,
            'thigh_right': float(self.thigh_right) if self.thigh_right else None,
            'calf_left': float(self.calf_left) if self.calf_left else None,
            'calf_right': float(self.calf_right) if self.calf_right else None,
            'neck': float(self.neck) if self.neck else None,
            'shoulders': float(self.shoulders) if self.shoulders else None,
            'body_fat_percentage': float(self.body_fat_percentage) if self.body_fat_percentage else None,
            'notes': self.notes,
            'measured_at': self.measured_at.isoformat() if self.measured_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }