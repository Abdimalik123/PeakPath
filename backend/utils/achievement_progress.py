"""
Achievement progress tracking utility.
Calculates current progress toward locked achievements.
"""
from models import Workout, HabitLog, Goal, UserPoint, Habit, ProgressPhoto
from database import db
from datetime import datetime, timedelta
from sqlalchemy import func


def get_achievement_progress(user_id):
    """
    Calculate progress toward all achievements for a user.
    Returns dict with achievement_key -> current_count mapping.
    """
    progress = {}

    # Workout counts
    workout_count = Workout.query.filter_by(user_id=user_id).count()
    progress['first_workout'] = min(workout_count, 1)
    progress['workouts_10'] = min(workout_count, 10)
    progress['workouts_50'] = min(workout_count, 50)
    progress['workouts_100'] = min(workout_count, 100)
    progress['workouts_500'] = min(workout_count, 500)

    # Workout variety
    distinct_types = db.session.query(Workout.type).filter(
        Workout.user_id == user_id
    ).distinct().count()
    progress['variety_seeker'] = min(distinct_types, 10)

    # Early bird / Night owl (based on created_at time)
    early_count = Workout.query.filter(
        Workout.user_id == user_id,
        func.extract('hour', Workout.created_at) < 9
    ).count()
    progress['early_bird'] = min(early_count, 20)

    night_count = Workout.query.filter(
        Workout.user_id == user_id,
        func.extract('hour', Workout.created_at) >= 20
    ).count()
    progress['night_owl'] = min(night_count, 20)

    # Habit log counts
    habit_log_count = db.session.query(func.count(HabitLog.id)).join(
        Habit, HabitLog.habit_id == Habit.id
    ).filter(Habit.user_id == user_id).scalar() or 0
    progress['first_habit_log'] = min(habit_log_count, 1)
    progress['habits_logged_50'] = min(habit_log_count, 50)

    # Habit creation counts
    habit_count = Habit.query.filter_by(user_id=user_id).count()
    progress['habits_created_5'] = min(habit_count, 5)
    progress['habits_created_10'] = min(habit_count, 10)

    # Consistency King: placeholder (would need rolling 30-day calc)
    progress['habit_consistency_90'] = 0

    # Goal counts
    goal_count = Goal.query.filter_by(user_id=user_id).count()
    progress['first_goal'] = min(goal_count, 1)

    completed_goals = Goal.query.filter(
        Goal.user_id == user_id,
        Goal.progress >= Goal.target
    ).count()
    progress['first_goal_completed'] = min(completed_goals, 1)
    progress['goals_completed_5'] = min(completed_goals, 5)
    progress['goals_completed_10'] = min(completed_goals, 10)
    progress['goals_completed_20'] = min(completed_goals, 20)

    # Speed Demon: check if any goal completed 30+ days before deadline
    early_goal = Goal.query.filter(
        Goal.user_id == user_id,
        Goal.progress >= Goal.target,
        Goal.deadline.isnot(None)
    ).all()
    speed_demon = 0
    for g in early_goal:
        if g.deadline and g.updated_at:
            days_early = (g.deadline - g.updated_at.date()).days
            if days_early >= 30:
                speed_demon = 1
                break
    progress['goal_early'] = speed_demon

    # Workout streaks
    workout_dates = db.session.query(Workout.date).filter(
        Workout.user_id == user_id
    ).distinct().order_by(Workout.date.desc()).all()
    workout_streak = _calculate_streak({d[0] for d in workout_dates})
    progress['streak_workout_7'] = min(workout_streak, 7)
    progress['streak_workout_14'] = min(workout_streak, 14)
    progress['streak_workout_30'] = min(workout_streak, 30)

    # Habit streaks (approximate: consecutive days with any habit logged)
    habit_dates = db.session.query(func.date(HabitLog.timestamp)).join(
        Habit, HabitLog.habit_id == Habit.id
    ).filter(Habit.user_id == user_id).distinct().all()
    habit_streak = _calculate_streak({d[0] for d in habit_dates})
    progress['streak_habit_7'] = min(habit_streak, 7)
    progress['streak_habit_30'] = min(habit_streak, 30)
    progress['streak_habit_60'] = min(habit_streak, 60)
    progress['streak_habit_100'] = min(habit_streak, 100)

    # Special achievements
    progress['welcome'] = 1  # All users have completed onboarding

    # Perfect Week: 7 consecutive days with workouts
    progress['perfect_week'] = min(workout_streak, 7)

    # Weekend Warrior: Saturdays worked out (approximate count)
    sat_count = Workout.query.filter(
        Workout.user_id == user_id,
        func.extract('dow', Workout.date) == 6
    ).count()
    progress['weekend_warrior'] = min(sat_count, 10)

    # Transformer: uploaded progress photos
    photo_count = ProgressPhoto.query.filter_by(user_id=user_id).count()
    progress['transformer'] = min(photo_count, 1) if photo_count >= 2 else 0

    # Level progress
    user_points = UserPoint.query.filter_by(user_id=user_id).first()
    current_level = user_points.level if user_points else 1
    progress['level_5'] = min(current_level, 5)
    progress['level_10'] = min(current_level, 10)
    progress['level_25'] = min(current_level, 25)

    # Points progress
    total_points = user_points.total_points if user_points else 0
    progress['points_500'] = min(total_points, 500)
    progress['points_1000'] = min(total_points, 1000)
    progress['points_5000'] = min(total_points, 5000)

    return progress


def _calculate_streak(dates_set):
    """Calculate longest streak from a set of dates."""
    if not dates_set:
        return 0
    sorted_dates = sorted(dates_set)
    longest = 1
    current = 1
    for i in range(1, len(sorted_dates)):
        if (sorted_dates[i] - sorted_dates[i-1]).days == 1:
            current += 1
            longest = max(longest, current)
        else:
            current = 1
    return longest


def get_achievement_target(achievement_key):
    """Get the target value for an achievement."""
    targets = {
        'first_workout': 1,
        'workouts_10': 10,
        'workouts_50': 50,
        'workouts_100': 100,
        'workouts_500': 500,
        'early_bird': 20,
        'night_owl': 20,
        'variety_seeker': 10,
        'first_habit_log': 1,
        'habits_created_5': 5,
        'habits_created_10': 10,
        'habits_logged_50': 50,
        'habit_consistency_90': 90,
        'streak_habit_7': 7,
        'streak_habit_30': 30,
        'streak_habit_60': 60,
        'streak_habit_100': 100,
        'streak_workout_7': 7,
        'streak_workout_14': 14,
        'streak_workout_30': 30,
        'first_goal': 1,
        'first_goal_completed': 1,
        'goals_completed_5': 5,
        'goals_completed_10': 10,
        'goals_completed_20': 20,
        'goal_early': 1,
        'welcome': 1,
        'perfect_week': 7,
        'weekend_warrior': 10,
        'transformer': 1,
        'level_5': 5,
        'level_10': 10,
        'level_25': 25,
        'points_500': 500,
        'points_1000': 1000,
        'points_5000': 5000,
    }
    return targets.get(achievement_key, 1)
