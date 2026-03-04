from database import db
from models import SocialActivity
from datetime import datetime


def create_social_activity(user_id, activity_type, action, details, reference_id=None, reference_type=None):
    """
    Create a social activity entry in its own committed transaction.
    Isolated so failures here never affect the caller's transaction.
    """
    try:
        activity = SocialActivity(
            user_id=user_id,
            activity_type=activity_type,
            action=action,
            details=details,
            reference_id=reference_id,
            reference_type=reference_type,
            likes_count=0,
            comments_count=0
        )
        db.session.add(activity)
        db.session.commit()
        return activity
    except Exception as e:
        db.session.rollback()
        raise e


def create_workout_activity(user_id, workout):
    """Create social activity for completed workout"""
    try:
        exercise_count = len(workout.exercises) if hasattr(workout, 'exercises') else 0
    except Exception:
        exercise_count = 0
    details = f"{workout.type} • {workout.duration} min • {exercise_count} exercises"

    return create_social_activity(
        user_id=user_id,
        activity_type='workout',
        action='completed a workout',
        details=details,
        reference_id=workout.id,
        reference_type='workouts'
    )


def create_goal_activity(user_id, goal, action_type='completed'):
    """Create social activity for goal completion or creation"""
    if action_type == 'completed':
        action = 'completed a goal'
        details = f"🎯 {goal.name} - Goal achieved!"
    else:
        action = 'created a goal'
        details = f"🎯 {goal.name}"

    return create_social_activity(
        user_id=user_id,
        activity_type='goal',
        action=action,
        details=details,
        reference_id=goal.id,
        reference_type='goals'
    )


def create_achievement_activity(user_id, achievement):
    """Create social activity for unlocking achievement"""
    details = f"🏆 {achievement.name} - {achievement.description}"

    return create_social_activity(
        user_id=user_id,
        activity_type='achievement',
        action='unlocked an achievement',
        details=details,
        reference_id=achievement.id,
        reference_type='achievements'
    )


def create_habit_activity(user_id, habit, streak_days):
    """Create social activity for habit streak milestone"""
    details = f"{streak_days} day streak on: {habit.name}!"

    return create_social_activity(
        user_id=user_id,
        activity_type='habit',
        action='reached a streak',
        details=details,
        reference_id=habit.id,
        reference_type='habits'
    )