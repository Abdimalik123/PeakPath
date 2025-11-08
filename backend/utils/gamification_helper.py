from db import get_db, return_db
from datetime import datetime, timedelta

# Point values configuration
WORKOUT_POINTS = 10
HABIT_COMPLETION_POINTS = 5
GOAL_MILESTONE_POINTS = 20
GOAL_COMPLETION_POINTS = 50
STREAK_BONUS_MULTIPLIER = 1.5
LEVEL_UP_THRESHOLD = 100


def award_points_for_action(user_id, action_type, entity_type, entity_id, base_points=None):
    """
    Award points to user for completing an action
    Returns: points awarded (int)
    """
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Determine base points
        if base_points is None:
            if action_type == "workout_completed":
                base_points = WORKOUT_POINTS
            elif action_type == "habit_logged":
                base_points = HABIT_COMPLETION_POINTS
            elif action_type == "goal_milestone":
                base_points = GOAL_MILESTONE_POINTS
            elif action_type == "goal_completed":
                base_points = GOAL_COMPLETION_POINTS
            else:
                base_points = 5
        
        # Check for streak bonus
        streak_multiplier = 1.0
        if action_type == "workout_completed":
            streak_days = calculate_workout_streak(user_id, cursor)
            if streak_days >= 7:
                streak_multiplier = STREAK_BONUS_MULTIPLIER
        
        points_to_award = int(base_points * streak_multiplier)
        
        # Insert transaction
        cursor.execute("""
            INSERT INTO point_transactions (user_id, points, reason, entity_type, entity_id)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, points_to_award, action_type, entity_type, entity_id))
        
        # Update user points
        cursor.execute("""
            INSERT INTO user_points (user_id, total_points, level, points_to_next_level)
            VALUES (%s, %s, 1, %s)
            ON CONFLICT (user_id) DO UPDATE
            SET total_points = user_points.total_points + %s,
                updated_at = CURRENT_TIMESTAMP
            RETURNING total_points
        """, (user_id, points_to_award, LEVEL_UP_THRESHOLD - points_to_award, points_to_award))
        
        new_total = cursor.fetchone()[0]
        
        # Check for level up
        new_level = (new_total // LEVEL_UP_THRESHOLD) + 1
        points_to_next = LEVEL_UP_THRESHOLD - (new_total % LEVEL_UP_THRESHOLD)
        
        cursor.execute("""
            UPDATE user_points
            SET level = %s, points_to_next_level = %s
            WHERE user_id = %s
        """, (new_level, points_to_next, user_id))
        
        conn.commit()
        
        # Check for achievements
        check_milestone_achievements(user_id, cursor, conn)
        
        return points_to_award
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        return_db(conn)


def calculate_workout_streak(user_id, cursor):
    """
    Calculate current workout streak in days
    Returns: streak_days (int)
    """
    cursor.execute("""
        SELECT date
        FROM workouts
        WHERE user_id = %s
        ORDER BY date DESC
        LIMIT 30
    """, (user_id,))
    
    workout_dates = [row[0] for row in cursor.fetchall()]
    
    if not workout_dates:
        return 0
    
    # Check if most recent workout is today or yesterday
    today = datetime.now().date()
    if workout_dates[0] < today - timedelta(days=1):
        return 0  # Streak broken
    
    streak = 1
    current_date = workout_dates[0]
    
    for date in workout_dates[1:]:
        expected_date = current_date - timedelta(days=1)
        if date == expected_date or date == current_date:
            if date != current_date:
                streak += 1
            current_date = date
        else:
            break
    
    return streak


def calculate_habit_streak(user_id, habit_id, cursor):
    """
    Calculate current habit streak in days
    Returns: streak_days (int)
    """
    cursor.execute("""
        SELECT DATE(timestamp) as log_date
        FROM habit_logs
        WHERE habit_id = %s AND completed = TRUE
        ORDER BY timestamp DESC
        LIMIT 30
    """, (habit_id,))
    
    log_dates = [row[0] for row in cursor.fetchall()]
    
    if not log_dates:
        return 0
    
    today = datetime.now().date()
    if log_dates[0] < today - timedelta(days=1):
        return 0
    
    streak = 1
    current_date = log_dates[0]
    
    for date in log_dates[1:]:
        expected_date = current_date - timedelta(days=1)
        if date == expected_date or date == current_date:
            if date != current_date:
                streak += 1
            current_date = date
        else:
            break
    
    return streak


def check_milestone_achievements(user_id, cursor, conn):
    """
    Check and award milestone achievements
    """
    # Check workout milestones
    cursor.execute("""
        SELECT COUNT(*) FROM workouts WHERE user_id = %s
    """, (user_id,))
    total_workouts = cursor.fetchone()[0]
    
    workout_milestones = [10, 25, 50, 100, 250, 500]
    for milestone in workout_milestones:
        if total_workouts == milestone:
            award_achievement(
                user_id, 
                "milestone", 
                f"workout_count_{milestone}",
                f"Completed {milestone} workouts!",
                {"count": milestone},
                cursor,
                conn
            )
    
    # Check workout streak
    streak = calculate_workout_streak(user_id, cursor)
    streak_milestones = [7, 14, 30, 60, 100]
    for milestone in streak_milestones:
        if streak == milestone:
            award_achievement(
                user_id,
                "streak",
                f"workout_streak_{milestone}",
                f"{milestone}-day workout streak!",
                {"streak_days": milestone},
                cursor,
                conn
            )
    
    # Check goals completed
    cursor.execute("""
        SELECT COUNT(*) FROM goals 
        WHERE user_id = %s AND progress >= target
    """, (user_id,))
    goals_completed = cursor.fetchone()[0]
    
    goal_milestones = [1, 5, 10, 25, 50]
    for milestone in goal_milestones:
        if goals_completed == milestone:
            award_achievement(
                user_id,
                "milestone",
                f"goals_completed_{milestone}",
                f"Completed {milestone} goals!",
                {"count": milestone},
                cursor,
                conn
            )


def award_achievement(user_id, achievement_type, achievement_name, description, metadata, cursor, conn):
    """
    Award an achievement to a user if they don't already have it
    """
    # Check if already earned
    cursor.execute("""
        SELECT id FROM user_achievements
        WHERE user_id = %s AND achievement_name = %s
    """, (user_id, achievement_name))
    
    if cursor.fetchone():
        return  # Already earned
    
    # Award achievement
    cursor.execute("""
        INSERT INTO user_achievements (user_id, achievement_type, achievement_name, description, metadata)
        VALUES (%s, %s, %s, %s, %s)
    """, (user_id, achievement_type, achievement_name, description, str(metadata)))
    
    conn.commit()
