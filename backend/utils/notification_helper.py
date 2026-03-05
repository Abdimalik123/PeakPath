"""
Notification helper utilities for creating and managing notifications.
"""
from database import db
from models.notification import Notification
from datetime import datetime


def create_notification(user_id, notification_type, message, priority='medium', 
                       entity_type=None, entity_id=None, action_url=None):
    """Create a new notification for a user"""
    try:
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            message=message,
            priority=priority,
            entity_type=entity_type,
            entity_id=entity_id,
            action_url=action_url,
            delivered_at=datetime.utcnow()
        )
        db.session.add(notification)
        db.session.flush()
        return notification
    except Exception as e:
        print(f"Error creating notification: {e}")
        return None


def notify_friend_workout(user_id, friend_username, workout_type):
    """Notify user that a friend completed a workout"""
    message = f"{friend_username} just completed a {workout_type} workout!"
    return create_notification(
        user_id=user_id,
        notification_type='friend_workout',
        message=message,
        priority='low',
        entity_type='workout',
        action_url='/social'
    )


def notify_friend_pr(user_id, friend_username, exercise_name, weight):
    """Notify user that a friend achieved a PR"""
    message = f"🎉 {friend_username} hit a new PR: {exercise_name} at {weight}kg!"
    return create_notification(
        user_id=user_id,
        notification_type='friend_pr',
        message=message,
        priority='medium',
        entity_type='pr',
        action_url='/social'
    )


def notify_challenge_invite(user_id, challenger_username, challenge_id, challenge_title):
    """Notify user of a challenge invitation"""
    message = f"{challenger_username} challenged you: {challenge_title}"
    return create_notification(
        user_id=user_id,
        notification_type='challenge_invite',
        message=message,
        priority='high',
        entity_type='challenge',
        entity_id=challenge_id,
        action_url=f'/challenges/{challenge_id}'
    )


def notify_challenge_completed(user_id, challenge_title):
    """Notify user they completed a challenge"""
    message = f"🏆 Congratulations! You completed: {challenge_title}"
    return create_notification(
        user_id=user_id,
        notification_type='challenge_completed',
        message=message,
        priority='high',
        entity_type='challenge',
        action_url='/challenges'
    )


def notify_achievement_unlocked(user_id, achievement_name):
    """Notify user of new achievement"""
    message = f"🏅 Achievement Unlocked: {achievement_name}!"
    return create_notification(
        user_id=user_id,
        notification_type='achievement_unlocked',
        message=message,
        priority='medium',
        entity_type='achievement',
        action_url='/achievements'
    )


def notify_level_up(user_id, new_level):
    """Notify user of level up"""
    message = f"⬆️ Level Up! You reached Level {new_level}!"
    return create_notification(
        user_id=user_id,
        notification_type='level_up',
        message=message,
        priority='high',
        entity_type='level',
        action_url='/dashboard'
    )


def notify_streak_milestone(user_id, streak_days):
    """Notify user of streak milestone"""
    message = f"🔥 Amazing! {streak_days}-day workout streak!"
    return create_notification(
        user_id=user_id,
        notification_type='streak_milestone',
        message=message,
        priority='medium',
        entity_type='streak',
        action_url='/dashboard'
    )


def notify_workout_reminder(user_id):
    """Remind user to log a workout"""
    message = "💪 Time to crush a workout! Your body is ready."
    return create_notification(
        user_id=user_id,
        notification_type='workout_reminder',
        message=message,
        priority='low',
        action_url='/workouts'
    )


def notify_friend_request(user_id, requester_username, requester_id):
    """Notify user of friend request"""
    message = f"{requester_username} sent you a friend request"
    return create_notification(
        user_id=user_id,
        notification_type='friend_request',
        message=message,
        priority='medium',
        entity_type='user',
        entity_id=requester_id,
        action_url='/social?tab=friends'
    )


def notify_leaderboard_position(user_id, position, leaderboard_type='points'):
    """Notify user of leaderboard position change"""
    message = f"📊 You're now #{position} on the {leaderboard_type} leaderboard!"
    return create_notification(
        user_id=user_id,
        notification_type='leaderboard_update',
        message=message,
        priority='low',
        entity_type='leaderboard',
        action_url='/social?tab=leaderboard'
    )
