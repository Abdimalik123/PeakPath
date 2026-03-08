from database import db
from datetime import datetime, timezone


class StreakFreeze(db.Model):
    __tablename__ = 'streak_freezes'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    freeze_date = db.Column(db.Date, nullable=False)
    freeze_type = db.Column(db.String(20), default='earned')  # 'earned' or 'points'
    points_cost = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', backref=db.backref('streak_freezes', lazy='dynamic'))

    __table_args__ = (
        db.UniqueConstraint('user_id', 'freeze_date', name='uq_user_freeze_date'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'freeze_date': self.freeze_date.isoformat(),
            'freeze_type': self.freeze_type,
            'points_cost': self.points_cost,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
