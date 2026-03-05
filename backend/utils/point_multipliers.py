"""
Point multiplier system for bonus points based on streaks and behaviors
"""
from datetime import datetime, timedelta
from database import db
from models import Workout


def calculate_point_multiplier(user_id):
    """Calculate point multiplier based on streaks and time-based bonuses"""
    multiplier = 1.0
    bonuses = []
    
    # Check workout streak
    today = datetime.utcnow().date()
    streak_days = 0
    check_date = today
    
    for i in range(30):  # Check last 30 days
        has_workout = Workout.query.filter(
            Workout.user_id == user_id,
            db.func.date(Workout.date) == check_date
        ).first()
        
        if has_workout:
            streak_days += 1
            check_date -= timedelta(days=1)
        else:
            break
    
    # Streak multipliers
    if streak_days >= 7:
        multiplier = 2.0
        bonuses.append("🔥 7-Day Streak: 2x")
    elif streak_days >= 3:
        multiplier = 1.5
        bonuses.append("🔥 3-Day Streak: 1.5x")
    
    # Time-based bonuses
    current_hour = datetime.utcnow().hour
    if current_hour < 7:
        multiplier += 0.25
        bonuses.append("🌅 Early Bird: +25%")
    elif current_hour >= 21:
        multiplier += 0.25
        bonuses.append("🌙 Night Owl: +25%")
    
    # Weekend bonus
    if datetime.utcnow().weekday() >= 5:  # Saturday or Sunday
        multiplier += 0.15
        bonuses.append("🎉 Weekend Warrior: +15%")
    
    return multiplier, bonuses


def calculate_pr_bonus():
    """PR achievements get 3x points"""
    return 3.0, ["💪 Personal Record: 3x"]


def calculate_perfect_week_bonus(user_id):
    """Check if user completed all workouts this week"""
    from models.daily_quest import UserDailyQuest
    from datetime import date
    
    # Check if all daily quests completed this week
    start_of_week = date.today() - timedelta(days=date.today().weekday())
    
    completed_days = UserDailyQuest.query.filter(
        UserDailyQuest.user_id == user_id,
        UserDailyQuest.date_assigned >= start_of_week,
        UserDailyQuest.is_completed == True
    ).count()
    
    if completed_days >= 7:
        return 1.5, ["⭐ Perfect Week: 1.5x"]
    
    return 1.0, []
