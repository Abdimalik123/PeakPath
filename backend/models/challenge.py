from database import db
from datetime import datetime


class Challenge(db.Model):
    __tablename__ = 'challenges'
    
    id = db.Column(db.Integer, primary_key=True)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    challenge_type = db.Column(db.String(50), nullable=False)  # workout_count, total_volume, specific_exercise, streak
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    target_value = db.Column(db.Float)
    target_exercise_id = db.Column(db.Integer, db.ForeignKey('exercises.id'), nullable=True)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    is_public = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default='active')  # active, completed, cancelled
    winner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', foreign_keys=[creator_id], backref='created_challenges')
    winner = db.relationship('User', foreign_keys=[winner_id])
    participants = db.relationship('ChallengeParticipant', back_populates='challenge', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'creator_id': self.creator_id,
            'challenge_type': self.challenge_type,
            'title': self.title,
            'description': self.description,
            'target_value': self.target_value,
            'target_exercise_id': self.target_exercise_id,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'is_public': self.is_public,
            'status': self.status,
            'winner_id': self.winner_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'participant_count': len(self.participants)
        }


class ChallengeParticipant(db.Model):
    __tablename__ = 'challenge_participants'
    
    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenges.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    current_progress = db.Column(db.Float, default=0)
    status = db.Column(db.String(20), default='active')  # active, completed, withdrawn
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    challenge = db.relationship('Challenge', back_populates='participants')
    user = db.relationship('User', backref='challenge_participations')
    
    def to_dict(self):
        return {
            'id': self.id,
            'challenge_id': self.challenge_id,
            'user_id': self.user_id,
            'current_progress': self.current_progress,
            'status': self.status,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
