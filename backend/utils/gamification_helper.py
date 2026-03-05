from database import db
from models.user_point import UserPoint
from models.user_achievement import UserAchievement
from models.point_transaction import PointTransaction
from flask import current_app
from datetime import datetime

# Point values for each action
POINT_VALUES = {
    "workout_logged": 15,
    "habit_completed": 10,
    "goal_completed": 50,
    "weight_logged": 5,
    "achievement_earned": 25,
}

# Achievement definitions: key -> (name, description, type, check_function_name)
ACHIEVEMENT_DEFINITIONS = {
    # Workout milestones
    "first_workout": {
        "name": "First Step",
        "description": "Complete your first workout",
        "type": "workout",
    },
    "workouts_10": {
        "name": "Getting Started",
        "description": "Complete 10 workouts",
        "type": "workout",
    },
    "workouts_50": {
        "name": "Dedicated",
        "description": "Complete 50 workouts",
        "type": "workout",
    },
    "workouts_100": {
        "name": "Century Club",
        "description": "Complete 100 workouts",
        "type": "workout",
    },
    "workouts_500": {
        "name": "Legend",
        "description": "Complete 500 workouts",
        "type": "workout",
    },
    "early_bird": {
        "name": "Early Bird",
        "description": "Complete 20 morning workouts (before 9 AM)",
        "type": "workout",
    },
    "night_owl": {
        "name": "Night Owl",
        "description": "Complete 20 evening workouts (after 8 PM)",
        "type": "workout",
    },
    "variety_seeker": {
        "name": "Variety Seeker",
        "description": "Try 10 different workout types",
        "type": "workout",
    },
    # Habit milestones
    "first_habit_log": {
        "name": "Habit Starter",
        "description": "Complete a habit for the first time",
        "type": "habit",
    },
    "habits_created_5": {
        "name": "Habit Builder",
        "description": "Create 5 habits",
        "type": "habit",
    },
    "habits_created_10": {
        "name": "Habit Master",
        "description": "Create 10 habits",
        "type": "habit",
    },
    "habits_logged_50": {
        "name": "Daily Grind",
        "description": "Log 50 habit completions",
        "type": "habit",
    },
    "habit_consistency_90": {
        "name": "Consistency King",
        "description": "90% habit completion rate over 30 days",
        "type": "habit",
    },
    # Streak milestones
    "streak_habit_7": {
        "name": "Week Warrior",
        "description": "Maintain a 7-day habit streak",
        "type": "streak",
    },
    "streak_habit_30": {
        "name": "Month Master",
        "description": "Maintain a 30-day habit streak",
        "type": "streak",
    },
    "streak_habit_60": {
        "name": "Iron Will",
        "description": "Maintain a 60-day habit streak",
        "type": "streak",
    },
    "streak_habit_100": {
        "name": "Unbreakable",
        "description": "Maintain a 100-day habit streak",
        "type": "streak",
    },
    "streak_workout_7": {
        "name": "On Fire",
        "description": "7-day workout streak",
        "type": "streak",
    },
    "streak_workout_14": {
        "name": "Blazing",
        "description": "14-day workout streak",
        "type": "streak",
    },
    "streak_workout_30": {
        "name": "Inferno",
        "description": "30-day workout streak",
        "type": "streak",
    },
    # Goal milestones
    "first_goal": {
        "name": "Dreamer",
        "description": "Set your first goal",
        "type": "goal",
    },
    "first_goal_completed": {
        "name": "Achiever",
        "description": "Complete 1 goal",
        "type": "goal",
    },
    "goals_completed_5": {
        "name": "Goal Crusher",
        "description": "Complete 5 goals",
        "type": "goal",
    },
    "goals_completed_10": {
        "name": "Overachiever",
        "description": "Complete 10 goals",
        "type": "goal",
    },
    "goals_completed_20": {
        "name": "Unstoppable",
        "description": "Complete 20 goals",
        "type": "goal",
    },
    "goal_early": {
        "name": "Speed Demon",
        "description": "Complete a goal 30 days early",
        "type": "goal",
    },
    # Special
    "welcome": {
        "name": "Welcome",
        "description": "Complete onboarding",
        "type": "special",
    },
    "perfect_week": {
        "name": "Perfect Week",
        "description": "Workout every day for a week",
        "type": "special",
    },
    "weekend_warrior": {
        "name": "Weekend Warrior",
        "description": "Workout 10 Saturdays in a row",
        "type": "special",
    },
    "transformer": {
        "name": "Transformer",
        "description": "Upload before and after photos",
        "type": "special",
    },
    # Level milestones
    "level_5": {
        "name": "Rising Star",
        "description": "Reach level 5",
        "type": "level",
    },
    "level_10": {
        "name": "Veteran",
        "description": "Reach level 10",
        "type": "level",
    },
    "level_25": {
        "name": "Legend",
        "description": "Reach level 25",
        "type": "level",
    },
    # Points milestones
    "points_500": {
        "name": "Half Grand",
        "description": "Earn 500 total points",
        "type": "points",
    },
    "points_1000": {
        "name": "Grand Master",
        "description": "Earn 1,000 total points",
        "type": "points",
    },
    "points_5000": {
        "name": "Elite",
        "description": "Earn 5,000 total points",
        "type": "points",
    },
}


def _get_or_create_user_points(user_id):
    """Get or create the UserPoint record for a user."""
    user_points = UserPoint.query.filter_by(user_id=user_id).first()
    if not user_points:
        user_points = UserPoint(
            user_id=user_id,
            total_points=0,
            level=1,
            points_to_next_level=100,
        )
        db.session.add(user_points)
        db.session.flush()
    return user_points


def _calculate_level(total_points):
    """Calculate level from total points. Each level costs level*100 points."""
    level = 1
    points_used = 0
    while True:
        required = level * 100
        if points_used + required > total_points:
            points_to_next = (points_used + required) - total_points
            return level, points_to_next
        points_used += required
        level += 1


def award_points(user_id, reason, points=None, entity_type=None, entity_id=None):
    """
    Award points to a user and handle level-ups.

    Returns dict with points_earned, new_total, level, leveled_up.
    """
    if points is None:
        points = POINT_VALUES.get(reason, 0)

    if points <= 0:
        return None

    try:
        user_points = _get_or_create_user_points(user_id)
        old_level = user_points.level

        user_points.total_points += points
        new_level, points_to_next = _calculate_level(user_points.total_points)
        user_points.level = new_level
        user_points.points_to_next_level = points_to_next

        # Record transaction
        transaction = PointTransaction(
            user_id=user_id,
            points=points,
            reason=reason,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        db.session.add(transaction)
        db.session.flush()

        leveled_up = new_level > old_level

        # Check level achievements after level-up
        if leveled_up:
            check_level_achievements(user_id, new_level)

        # Check points milestones
        check_points_achievements(user_id, user_points.total_points)

        return {
            "points_earned": points,
            "new_total": user_points.total_points,
            "level": new_level,
            "points_to_next_level": points_to_next,
            "leveled_up": leveled_up,
        }

    except Exception as e:
        current_app.logger.error(f"Error awarding points to user {user_id}: {e}")
        raise


def _has_achievement(user_id, achievement_key):
    """Check if user already has a specific achievement."""
    return UserAchievement.query.filter_by(
        user_id=user_id,
        achievement_type=achievement_key,
    ).first() is not None


def _grant_achievement(user_id, achievement_key):
    """Grant an achievement if not already earned. Returns the achievement or None."""
    if _has_achievement(user_id, achievement_key):
        return None

    definition = ACHIEVEMENT_DEFINITIONS.get(achievement_key)
    if not definition:
        return None

    achievement = UserAchievement(
        user_id=user_id,
        achievement_type=achievement_key,
        achievement_name=definition["name"],
        description=definition["description"],
    )
    db.session.add(achievement)
    db.session.flush()

    # Award bonus points for earning an achievement
    award_points(user_id, "achievement_earned", entity_type="achievement", entity_id=achievement.id)

    return achievement


def check_workout_achievements(user_id, workout_count):
    """Check and grant workout-related achievements."""
    earned = []
    thresholds = {1: "first_workout", 10: "workouts_10", 50: "workouts_50", 100: "workouts_100", 500: "workouts_500"}
    for threshold, key in thresholds.items():
        if workout_count >= threshold:
            achievement = _grant_achievement(user_id, key)
            if achievement:
                earned.append(achievement)

    # Variety Seeker: 10 different workout types
    try:
        from models import Workout
        distinct_types = db.session.query(Workout.type).filter(
            Workout.user_id == user_id
        ).distinct().count()
        if distinct_types >= 10:
            achievement = _grant_achievement(user_id, "variety_seeker")
            if achievement:
                earned.append(achievement)
    except Exception:
        pass

    return earned


def check_habit_achievements(user_id, total_habit_logs):
    """Check and grant habit-related achievements."""
    earned = []
    thresholds = {1: "first_habit_log", 50: "habits_logged_50"}
    for threshold, key in thresholds.items():
        if total_habit_logs >= threshold:
            achievement = _grant_achievement(user_id, key)
            if achievement:
                earned.append(achievement)

    # Habit creation milestones
    try:
        from models import Habit
        habit_count = Habit.query.filter_by(user_id=user_id).count()
        creation_thresholds = {5: "habits_created_5", 10: "habits_created_10"}
        for threshold, key in creation_thresholds.items():
            if habit_count >= threshold:
                achievement = _grant_achievement(user_id, key)
                if achievement:
                    earned.append(achievement)
    except Exception:
        pass

    return earned


def check_goal_achievements(user_id, completed_goals_count):
    """Check and grant goal-related achievements."""
    earned = []
    thresholds = {1: "first_goal_completed", 5: "goals_completed_5", 10: "goals_completed_10", 20: "goals_completed_20"}
    for threshold, key in thresholds.items():
        if completed_goals_count >= threshold:
            achievement = _grant_achievement(user_id, key)
            if achievement:
                earned.append(achievement)

    # First goal created
    try:
        from models import Goal
        goal_count = Goal.query.filter_by(user_id=user_id).count()
        if goal_count >= 1:
            achievement = _grant_achievement(user_id, "first_goal")
            if achievement:
                earned.append(achievement)
    except Exception:
        pass

    return earned


def check_streak_achievements(user_id, workout_streak=0, habit_streak=0):
    """Check and grant streak-related achievements."""
    earned = []
    workout_thresholds = {7: "streak_workout_7", 14: "streak_workout_14", 30: "streak_workout_30"}
    for threshold, key in workout_thresholds.items():
        if workout_streak >= threshold:
            achievement = _grant_achievement(user_id, key)
            if achievement:
                earned.append(achievement)

    habit_thresholds = {7: "streak_habit_7", 30: "streak_habit_30", 60: "streak_habit_60", 100: "streak_habit_100"}
    for threshold, key in habit_thresholds.items():
        if habit_streak >= threshold:
            achievement = _grant_achievement(user_id, key)
            if achievement:
                earned.append(achievement)

    return earned


def check_level_achievements(user_id, current_level):
    """Check and grant level-related achievements."""
    earned = []
    thresholds = {5: "level_5", 10: "level_10", 25: "level_25"}
    for threshold, key in thresholds.items():
        if current_level >= threshold:
            achievement = _grant_achievement(user_id, key)
            if achievement:
                earned.append(achievement)
    return earned


def check_points_achievements(user_id, total_points):
    """Check and grant points milestone achievements."""
    earned = []
    thresholds = {500: "points_500", 1000: "points_1000", 5000: "points_5000"}
    for threshold, key in thresholds.items():
        if total_points >= threshold:
            achievement = _grant_achievement(user_id, key)
            if achievement:
                earned.append(achievement)
    return earned


def get_user_stats(user_id):
    """Get full gamification stats for a user."""
    user_points = _get_or_create_user_points(user_id)

    achievements = UserAchievement.query.filter_by(user_id=user_id)\
        .order_by(UserAchievement.earned_at.desc()).all()

    recent_transactions = PointTransaction.query.filter_by(user_id=user_id)\
        .order_by(PointTransaction.created_at.desc()).limit(20).all()

    # Count total available vs earned achievements
    total_available = len(ACHIEVEMENT_DEFINITIONS)
    total_earned = len(achievements)

    return {
        "points": {
            "total": user_points.total_points,
            "level": user_points.level,
            "points_to_next_level": user_points.points_to_next_level,
        },
        "achievements": {
            "earned": [a.to_dict() for a in achievements],
            "total_earned": total_earned,
            "total_available": total_available,
        },
        "recent_activity": [
            {
                "points": t.points,
                "reason": t.reason,
                "entity_type": t.entity_type,
                "entity_id": t.entity_id,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in recent_transactions
        ],
    }
