from database import db
from datetime import datetime


class ActivityReaction(db.Model):
    __tablename__ = 'activity_reactions'
    
    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('social_activities.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    reaction_type = db.Column(db.String(20), nullable=False)  # 'strong', 'fire', 'clap', 'wow', 'heart'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    activity = db.relationship('SocialActivity', backref='reactions')
    user = db.relationship('User', backref='activity_reactions')
    
    __table_args__ = (
        db.UniqueConstraint('activity_id', 'user_id', 'reaction_type', name='unique_user_reaction'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'activity_id': self.activity_id,
            'user_id': self.user_id,
            'reaction_type': self.reaction_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
