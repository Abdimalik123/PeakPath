from database import db
from models.notification import Notification
from flask import current_app
from datetime import datetime


def create_notification(user_id, notification_type, message, priority="normal"):
    """
    Create a notification for a user.

    Args:
        user_id: The user to notify
        notification_type: Category (achievement, goal, streak, level_up, reminder)
        message: The notification message
        priority: low, normal, high
    """
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
    """Notify user they earned an achievement."""
    return create_notification(
        user_id,
        "achievement",
        f"Achievement unlocked: {achievement_name}!",
        priority="high",
    )


def notify_level_up(user_id, new_level):
    """Notify user they leveled up."""
    return create_notification(
        user_id,
        "level_up",
        f"You reached level {new_level}!",
        priority="high",
    )


def notify_goal_completed(user_id, goal_name):
    """Notify user a goal was completed."""
    return create_notification(
        user_id,
        "goal",
        f"Goal completed: {goal_name}! +50 points",
        priority="high",
    )


def notify_goal_progress(user_id, goal_name, progress, target):
    """Notify user of significant goal progress (50%, 75%, 90%)."""
    pct = int((progress / target) * 100) if target > 0 else 0
    return create_notification(
        user_id,
        "goal",
        f"{goal_name}: {pct}% complete ({progress}/{target})",
        priority="normal",
    )


def notify_points_earned(user_id, points, reason):
    """Notify user of points earned."""
    reason_labels = {
        "workout_logged": "logging a workout",
        "habit_completed": "completing a habit",
        "goal_completed": "completing a goal",
        "weight_logged": "logging your weight",
        "achievement_earned": "earning an achievement",
    }
    label = reason_labels.get(reason, reason)
    return create_notification(
        user_id,
        "points",
        f"+{points} points for {label}",
        priority="low",
    )
