from database import db
from datetime import datetime

class SocialActivity(db.Model):
    __tablename__ = "social_activities"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    activity_type = db.Column(db.String(50), nullable=False)  # workout, goal, achievement, habit
    action = db.Column(db.String(255), nullable=False)
    details = db.Column(db.Text)
    reference_id = db.Column(db.Integer)  # ID of the related workout/goal/achievement/habit
    reference_type = db.Column(db.String(50))  # workouts, goals, achievements, habits
    likes_count = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="social_activities")
    likes = db.relationship("ActivityLike", back_populates="activity", cascade="all, delete-orphan")
    comments = db.relationship("ActivityComment", back_populates="activity", cascade="all, delete-orphan")

    __table_args__ = (
        db.Index('idx_social_activities_user_created', 'user_id', 'created_at'),
    )

    def __repr__(self):
        return f"<SocialActivity {self.user_id} - {self.activity_type}>"


class ActivityLike(db.Model):
    __tablename__ = "activity_likes"

    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('social_activities.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    activity = db.relationship("SocialActivity", back_populates="likes")
    user = db.relationship("User", backref="activity_likes")

    __table_args__ = (
        db.UniqueConstraint('activity_id', 'user_id', name='unique_activity_like'),
        db.Index('idx_activity_likes_activity_id', 'activity_id'),
    )

    def __repr__(self):
        return f"<ActivityLike {self.user_id} -> Activity {self.activity_id}>"


class ActivityComment(db.Model):
    __tablename__ = "activity_comments"

    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('social_activities.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    comment = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    activity = db.relationship("SocialActivity", back_populates="comments")
    user = db.relationship("User", backref="activity_comments")

    __table_args__ = (
        db.Index('idx_activity_comments_activity_id', 'activity_id'),
    )

    def __repr__(self):
        return f"<ActivityComment {self.user_id} on Activity {self.activity_id}>"
