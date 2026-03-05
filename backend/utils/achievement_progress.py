"""
Achievement progress tracking utility.
Calculates current progress toward locked achievements.
"""
from models import Workout, HabitLog, Goal, UserPoint
from database import db


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
    
    # Habit log counts
    habit_log_count = HabitLog.query.filter_by(user_id=user_id).count()
    progress['first_habit_log'] = min(habit_log_count, 1)
    progress['habits_logged_50'] = min(habit_log_count, 50)
    progress['habits_logged_200'] = min(habit_log_count, 200)
    
    # Goal completion counts
    completed_goals = Goal.query.filter_by(user_id=user_id, status='completed').count()
    progress['first_goal_completed'] = min(completed_goals, 1)
    progress['goals_completed_5'] = min(completed_goals, 5)
    progress['goals_completed_20'] = min(completed_goals, 20)
    
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


def get_achievement_target(achievement_key):
    """Get the target value for an achievement."""
    targets = {
        'first_workout': 1,
        'workouts_10': 10,
        'workouts_50': 50,
        'workouts_100': 100,
        'first_habit_log': 1,
        'habits_logged_50': 50,
        'habits_logged_200': 200,
        'first_goal_completed': 1,
        'goals_completed_5': 5,
        'goals_completed_20': 20,
        'level_5': 5,
        'level_10': 10,
        'level_25': 25,
        'points_500': 500,
        'points_1000': 1000,
        'points_5000': 5000,
    }
    return targets.get(achievement_key, 1)
