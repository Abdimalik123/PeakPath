from database import db
from models.notification import Notification
from flask import current_app
from datetime import datetime


def create_notification(user_id, notification_type, message, priority="normal"):
    try:
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            message=message,
            priority=priority,
            scheduled_for=datetime.utcnow(),
            delivered_at=datetime.utcnow(),
        )
        db.session.add(notification)
        db.session.flush()
        return notification
    except Exception as e:
        current_app.logger.error(f"Error creating notification for user {user_id}: {e}")
        return None


def notify_achievement(user_id, achievement_name):
    return create_notification(user_id, "achievement", f"Achievement unlocked: {achievement_name}!", priority="high")


def notify_level_up(user_id, new_level):
    return create_notification(user_id, "level_up", f"You reached level {new_level}!", priority="high")


def notify_goal_completed(user_id, goal_name):
    return create_notification(user_id, "goal", f"Goal completed: {goal_name}! +50 points", priority="high")


def notify_goal_progress(user_id, goal_name, progress, target):
    pct = int((progress / target) * 100) if target > 0 else 0
    return create_notification(user_id, "goal", f"{goal_name}: {pct}% complete ({progress}/{target})", priority="normal")


def notify_points_earned(user_id, points, reason):
    reason_labels = {
        "workout_logged": "logging a workout",
        "habit_completed": "completing a habit",
        "goal_completed": "completing a goal",
        "weight_logged": "logging your weight",
        "achievement_earned": "earning an achievement",
    }
    label = reason_labels.get(reason, reason)
    return create_notification(user_id, "points", f"+{points} points for {label}", priority="low")


def notify_friend_request(user_id, sender_name):
    """Notify user they received a friend request."""
    return create_notification(
        user_id,
        "friend_request",
        f"{sender_name} sent you a friend request",
        priority="high",
    )


def notify_friend_accepted(user_id, accepter_name):
    """Notify user their friend request was accepted."""
    return create_notification(
        user_id,
        "friend_accepted",
        f"{accepter_name} accepted your friend request",
        priority="normal",
    )


def notify_activity_liked(user_id, liker_name, activity_action):
    """Notify user someone liked their activity."""
    return create_notification(
        user_id,
        "like",
        f"{liker_name} liked your activity: {activity_action}",
        priority="normal",
    )


def notify_activity_commented(user_id, commenter_name, activity_action, comment_preview):
    """Notify user someone commented on their activity."""
    preview = comment_preview[:50] + "..." if len(comment_preview) > 50 else comment_preview
    return create_notification(
        user_id,
        "comment",
        f"{commenter_name} commented on your {activity_action}: \"{preview}\"",
        priority="normal",
    )