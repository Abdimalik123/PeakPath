from database import db
from datetime import datetime, date


class DailyQuest(db.Model):
    __tablename__ = 'daily_quests'
    
    id = db.Column(db.Integer, primary_key=True)
    quest_type = db.Column(db.String(50), nullable=False)  # log_workout, complete_habit, comment_on_friend, hit_pr
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    points_reward = db.Column(db.Integer, default=50)
    target_value = db.Column(db.Integer, default=1)
    icon = db.Column(db.String(50))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'quest_type': self.quest_type,
            'title': self.title,
            'description': self.description,
            'points_reward': self.points_reward,
            'target_value': self.target_value,
            'icon': self.icon
        }


class UserDailyQuest(db.Model):
    __tablename__ = 'user_daily_quests'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    quest_id = db.Column(db.Integer, db.ForeignKey('daily_quests.id'), nullable=False)
    date_assigned = db.Column(db.Date, nullable=False, default=date.today)
    current_progress = db.Column(db.Integer, default=0)
    is_completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    quest = db.relationship('DailyQuest', backref='user_assignments')
    user = db.relationship('User', backref='daily_quests')
    
    def to_dict(self):
        quest_data = self.quest.to_dict() if self.quest else {}
        return {
            'id': self.id,
            'user_id': self.user_id,
            'quest': quest_data,
            'current_progress': self.current_progress,
            'is_completed': self.is_completed,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'progress_percentage': int((self.current_progress / quest_data.get('target_value', 1)) * 100) if quest_data.get('target_value', 1) > 0 else 0
        }
