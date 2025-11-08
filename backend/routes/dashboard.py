from flask import Blueprint, request, jsonify, g
from db import get_db, return_db
from routes.auth import login_required
from datetime import datetime, timedelta
from utils.gamification_helper import calculate_workout_streak, calculate_habit_streak

dashboard_bp = Blueprint('dashboard_bp', __name__)

@dashboard_bp.route('/dashboard', methods=['GET'])
@login_required
def get_dashboard():
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # User info with points
        cursor.execute("""
            SELECT u.firstname, u.lastname, up.total_points, up.level, up.points_to_next_level
            FROM users u
            LEFT JOIN user_points up ON up.user_id = u.id
            WHERE u.id = %s
        """, (user_id,))
        
        user_data = cursor.fetchone()
        user_info = {
            "name": f"{user_data[0]} {user_data[1]}" if user_data[0] else "User",
            "level": user_data[3] if user_data[3] else 1,
            "total_points": user_data[2] if user_data[2] else 0,
            "points_to_next_level": user_data[4] if user_data[4] else 100
        }
        
        # Today's stats
        today = datetime.now().date()
        
        cursor.execute("SELECT COUNT(*) FROM workouts WHERE user_id = %s AND date = %s", (user_id, today))
        workouts_today = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM habit_logs hl
            JOIN habits h ON hl.habit_id = h.id
            WHERE h.user_id = %s AND DATE(hl.timestamp) = %s
        """, (user_id, today))
        habits_today = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COALESCE(SUM(points), 0) FROM point_transactions
            WHERE user_id = %s AND DATE(created_at) = %s
        """, (user_id, today))
        points_today = cursor.fetchone()[0]
        
        today_stats = {
            "workouts_completed": workouts_today,
            "habits_logged": habits_today,
            "points_earned": points_today
        }
        
        # Recent workouts
        cursor.execute("""
            SELECT w.id, w.type, w.duration, w.date, COUNT(we.id) as exercise_count
            FROM workouts w
            LEFT JOIN workout_exercises we ON we.workout_id = w.id
            WHERE w.user_id = %s
            GROUP BY w.id
            ORDER BY w.date DESC, w.created_at DESC
            LIMIT 5
        """, (user_id,))
        
        recent_workouts = [
            {"id": row[0], "type": row[1], "duration": row[2], "date": row[3], "exercise_count": row[4]}
            for row in cursor.fetchall()
        ]
        
        # Active goals
        cursor.execute("""
            SELECT id, name, type, target, progress, deadline
            FROM goals WHERE user_id = %s AND progress < target
            ORDER BY deadline ASC LIMIT 5
        """, (user_id,))
        
        active_goals = []
        for row in cursor.fetchall():
            progress_pct = round((row[4] / row[3] * 100), 1) if row[3] > 0 else 0
            active_goals.append({
                "id": row[0], "name": row[1], "type": row[2],
                "target": row[3], "progress": row[4],
                "progress_percentage": progress_pct, "deadline": row[5]
            })
        
        # Habit streaks
        cursor.execute("SELECT id, name, frequency FROM habits WHERE user_id = %s", (user_id,))
        habits = cursor.fetchall()
        habit_streaks = []
        
        for habit in habits:
            current_streak = calculate_habit_streak(user_id, habit[0], cursor)
            habit_streaks.append({
                "habit_id": habit[0], "habit_name": habit[1],
                "frequency": habit[2], "current_streak": current_streak,
                "best_streak": current_streak
            })
        
        # Weekly activity
        week_start = today - timedelta(days=6)
        weekly_activity = []
        
        for i in range(7):
            day = week_start + timedelta(days=i)
            cursor.execute("SELECT COUNT(*) FROM workouts WHERE user_id = %s AND date = %s", (user_id, day))
            workouts = cursor.fetchone()[0]
            cursor.execute("""
                SELECT COUNT(*) FROM habit_logs hl
                JOIN habits h ON hl.habit_id = h.id
                WHERE h.user_id = %s AND DATE(hl.timestamp) = %s
            """, (user_id, day))
            habits_count = cursor.fetchone()[0]
            weekly_activity.append({"date": str(day), "workouts": workouts, "habits": habits_count})
        
        # Recent achievements
        cursor.execute("""
            SELECT achievement_name, description, earned_at
            FROM user_achievements WHERE user_id = %s
            ORDER BY earned_at DESC LIMIT 3
        """, (user_id,))
        
        recent_achievements = [
            {"name": row[0], "description": row[1], "earned_at": row[2]}
            for row in cursor.fetchall()
        ]
        
        dashboard = {
            "user": user_info,
            "today": today_stats,
            "recent_workouts": recent_workouts,
            "active_goals": active_goals,
            "habit_streaks": habit_streaks,
            "weekly_activity": weekly_activity,
            "recent_achievements": recent_achievements
        }
        
        return jsonify({"success": True, "dashboard": dashboard}), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)
