from database import db
from models.goal import Goal
from models.goal_link import GoalLink
from models.workout import Workout
from models.habit_log import HabitLog
from flask import current_app


def sync_goal_progress(user_id, entity_type, entity_id=None, entity_value=None):
    """
    Sync goal progress when a workout or habit is logged.

    Args:
        user_id: User ID
        entity_type: 'workout' or 'habit'
        entity_id: workout_id or habit_id
        entity_value: workout type string (for workout-type matching)
    """
    try:
        # Find auto-sync goals with matching links
        query = db.session.query(GoalLink, Goal).join(
            Goal, Goal.id == GoalLink.goal_id
        ).filter(
            Goal.user_id == user_id,
            Goal.auto_sync == True,
            GoalLink.entity_type == entity_type,
        )

        if entity_type == 'workout':
            query = query.filter(
                db.or_(
                    GoalLink.linked_workout_type == entity_value,
                    GoalLink.linked_workout_type.is_(None),
                )
            )
        elif entity_type == 'habit':
            query = query.filter(GoalLink.entity_id == entity_id)

        linked = query.all()
        completed_goals = []

        for link, goal in linked:
            old_progress = goal.progress or 0
            goal.progress = old_progress + link.contribution_value

            # Check if goal just completed
            if old_progress < goal.target and goal.progress >= goal.target:
                completed_goals.append(goal)

        db.session.flush()
        return completed_goals

    except Exception as e:
        current_app.logger.error(f"Error syncing goal progress for user {user_id}: {e}")
        raise


def recalculate_goal_progress(goal_id, user_id):
    """Recalculate goal progress from scratch based on all linked entities."""
    try:
        links = GoalLink.query.filter_by(goal_id=goal_id).all()
        total_progress = 0

        for link in links:
            if link.entity_type == 'workout':
                query = Workout.query.filter_by(user_id=user_id)
                if link.linked_workout_type:
                    query = query.filter_by(type=link.linked_workout_type)
                count = query.count()
                total_progress += count * link.contribution_value

            elif link.entity_type == 'habit':
                count = HabitLog.query.filter_by(
                    habit_id=link.entity_id,
                    completed=True,
                ).count()
                total_progress += count * link.contribution_value

        goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
        if goal:
            goal.progress = total_progress
            db.session.flush()

        return total_progress

    except Exception as e:
        current_app.logger.error(f"Error recalculating goal {goal_id}: {e}")
        raise
