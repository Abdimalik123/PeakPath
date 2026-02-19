"""
Orchestration layer that ties together gamification, goal sync, and notifications.

Endpoints call these functions after a successful action. Each function handles:
1. Awarding points
2. Checking achievements
3. Syncing goal progress
4. Sending notifications
"""
from flask import current_app
from utils.gamification_helper import (
    award_points,
    check_workout_achievements,
    check_habit_achievements,
    check_goal_achievements,
)
from utils.goal_sync import sync_goal_progress
from utils.notifications import (
    notify_achievement,
    notify_level_up,
    notify_goal_completed,
    notify_goal_progress,
    notify_points_earned,
)


def _handle_reward_result(user_id, result):
    """Send notifications for points earned and level-ups."""
    if not result:
        return
    if result.get("leveled_up"):
        notify_level_up(user_id, result["level"])


def _handle_achievements(user_id, achievements):
    """Send notifications for newly earned achievements."""
    for achievement in achievements:
        notify_achievement(user_id, achievement.achievement_name)


def _handle_completed_goals(user_id, completed_goals):
    """Award points and send notifications for completed goals."""
    from models.goal import Goal
    from database import db

    for goal in completed_goals:
        result = award_points(user_id, "goal_completed", entity_type="goal", entity_id=goal.id)
        _handle_reward_result(user_id, result)
        notify_goal_completed(user_id, goal.name)

    # Check goal achievements
    completed_count = Goal.query.filter(
        Goal.user_id == user_id,
        Goal.progress >= Goal.target,
    ).count()
    achievements = check_goal_achievements(user_id, completed_count)
    _handle_achievements(user_id, achievements)


def on_workout_logged(user_id, workout):
    """Called after a workout is successfully created."""
    try:
        from models.workout import Workout

        # 1. Award points
        result = award_points(
            user_id, "workout_logged",
            entity_type="workout", entity_id=workout.id,
        )
        _handle_reward_result(user_id, result)

        # 2. Check workout achievements
        workout_count = Workout.query.filter_by(user_id=user_id).count()
        achievements = check_workout_achievements(user_id, workout_count)
        _handle_achievements(user_id, achievements)

        # 3. Sync goal progress
        completed_goals = sync_goal_progress(
            user_id, "workout",
            entity_id=workout.id,
            entity_value=workout.type,
        )
        if completed_goals:
            _handle_completed_goals(user_id, completed_goals)

    except Exception as e:
        current_app.logger.error(f"Error in on_workout_logged for user {user_id}: {e}")


def on_habit_logged(user_id, habit_id, habit_log):
    """Called after a habit completion is logged."""
    try:
        from models.habit_log import HabitLog

        if not habit_log.completed:
            return

        # 1. Award points
        result = award_points(
            user_id, "habit_completed",
            entity_type="habit", entity_id=habit_id,
        )
        _handle_reward_result(user_id, result)

        # 2. Check habit achievements
        total_logs = HabitLog.query.filter_by(completed=True)\
            .join(HabitLog.habit)\
            .filter_by(user_id=user_id).count()
        achievements = check_habit_achievements(user_id, total_logs)
        _handle_achievements(user_id, achievements)

        # 3. Sync goal progress
        completed_goals = sync_goal_progress(
            user_id, "habit",
            entity_id=habit_id,
        )
        if completed_goals:
            _handle_completed_goals(user_id, completed_goals)

    except Exception as e:
        current_app.logger.error(f"Error in on_habit_logged for user {user_id}: {e}")


def on_weight_logged(user_id, weight_log_id):
    """Called after a weight log is created."""
    try:
        result = award_points(
            user_id, "weight_logged",
            entity_type="weight_log", entity_id=weight_log_id,
        )
        _handle_reward_result(user_id, result)

    except Exception as e:
        current_app.logger.error(f"Error in on_weight_logged for user {user_id}: {e}")
