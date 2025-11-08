from flask import Blueprint, request, jsonify, g
from db import get_db, return_db
from routes.auth import login_required
from datetime import datetime, timedelta

summary_bp = Blueprint('summary_bp', __name__)

@summary_bp.route('/summary/weekly', methods=['GET'])
@login_required
def get_weekly_summary():
    user_id = g.user['id']
    week_offset = request.args.get('week_offset', 0, type=int)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Calculate week bounds
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday()) + timedelta(weeks=week_offset)
        week_end = week_start + timedelta(days=6)
        week_number = week_start.isocalendar()[1]
        
        # Workout summary
        cursor.execute("""
            SELECT 
                COUNT(*) as total_workouts,
                COALESCE(SUM(duration), 0) as total_duration,
                type,
                COUNT(*) as type_count
            FROM workouts
            WHERE user_id = %s AND date >= %s AND date <= %s
            GROUP BY type
        """, (user_id, week_start, week_end))
        
        workout_data = cursor.fetchall()
        total_workouts = sum(row[3] for row in workout_data)
        total_duration = sum(row[1] for row in workout_data) if workout_data else 0
        workout_types = {row[2]: row[3] for row in workout_data if row[2]}
        
        # Habit summary
        cursor.execute("""
            SELECT h.id, h.name, h.frequency, COUNT(hl.id) as logs_count
            FROM habits h
            LEFT JOIN habit_logs hl ON hl.habit_id = h.id 
                AND hl.timestamp >= %s AND hl.timestamp <= %s
            WHERE h.user_id = %s
            GROUP BY h.id, h.name, h.frequency
        """, (week_start, week_end, user_id))
        
        habit_data = cursor.fetchall()
        total_habits_logged = sum(row[3] for row in habit_data)
        habits_by_habit = [
            {
                "habit_id": row[0],
                "name": row[1],
                "frequency": row[2],
                "logs_count": row[3]
            }
            for row in habit_data
        ]
        
        # Calculate completion rate (assuming daily frequency for simplicity)
        expected_logs = len(habit_data) * 7
        completion_rate = round((total_habits_logged / expected_logs * 100), 1) if expected_logs > 0 else 0
        
        # Goals progress
        cursor.execute("""
            SELECT id, name, type, target, progress, deadline
            FROM goals
            WHERE user_id = %s AND progress < target
        """, (user_id,))
        
        goals_data = cursor.fetchall()
        active_goals = len(goals_data)
        goals_list = [
            {
                "id": row[0],
                "name": row[1],
                "type": row[2],
                "target": row[3],
                "progress": row[4],
                "deadline": row[5]
            }
            for row in goals_data
        ]
        
        # Weight change
        cursor.execute("""
            SELECT weight_kg, date
            FROM weight_logs
            WHERE user_id = %s AND date >= %s AND date <= %s
            ORDER BY date ASC
        """, (user_id, week_start, week_end))
        
        weight_logs = cursor.fetchall()
        weight_start = weight_logs[0][0] if weight_logs else None
        weight_end = weight_logs[-1][0] if weight_logs else None
        weight_change = round(weight_end - weight_start, 1) if weight_start and weight_end else None
        
        # Points earned this week
        cursor.execute("""
            SELECT COALESCE(SUM(points), 0)
            FROM point_transactions
            WHERE user_id = %s AND created_at >= %s AND created_at <= %s
        """, (user_id, week_start, week_end))
        
        points_earned = cursor.fetchone()[0]
        
        # Achievements earned this week
        cursor.execute("""
            SELECT achievement_name, description, earned_at
            FROM user_achievements
            WHERE user_id = %s AND earned_at >= %s AND earned_at <= %s
        """, (user_id, week_start, week_end))
        
        achievements = [
            {"name": row[0], "description": row[1], "earned_at": row[2]}
            for row in cursor.fetchall()
        ]
        
        # Daily breakdown
        daily_activity = []
        for i in range(7):
            day_date = week_start + timedelta(days=i)
            
            cursor.execute("""
                SELECT COUNT(*) FROM workouts
                WHERE user_id = %s AND date = %s
            """, (user_id, day_date))
            workouts_count = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT COUNT(*) FROM habit_logs hl
                JOIN habits h ON hl.habit_id = h.id
                WHERE h.user_id = %s AND DATE(hl.timestamp) = %s
            """, (user_id, day_date))
            habits_count = cursor.fetchone()[0]
            
            daily_activity.append({
                "date": str(day_date),
                "day": day_date.strftime("%A"),
                "workouts": workouts_count,
                "habits": habits_count
            })
        
        summary = {
            "week": {
                "start_date": str(week_start),
                "end_date": str(week_end),
                "week_number": week_number
            },
            "summary": {
                "workouts": {
                    "count": total_workouts,
                    "total_duration": total_duration,
                    "types": workout_types
                },
                "habits": {
                    "total_logged": total_habits_logged,
                    "completion_rate": completion_rate,
                    "by_habit": habits_by_habit
                },
                "goals": {
                    "active": active_goals,
                    "progress_made": goals_list
                },
                "weight": {
                    "start": weight_start,
                    "end": weight_end,
                    "change": weight_change
                },
                "gamification": {
                    "points_earned": points_earned,
                    "achievements": achievements
                },
                "daily_activity": daily_activity
            }
        }
        
        return jsonify({"success": True, **summary}), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)
