from flask import Blueprint, request, jsonify, g
from db import get_db, return_db
from api.auth import login_required
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard_bp', __name__)

@dashboard_bp.route('/dashboard', methods=['GET'])
@login_required
def get_dashboard():
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # User info
        cursor.execute("""
            SELECT u.firstname, u.lastname
            FROM users u
            WHERE u.id = %s
        """, (user_id,))
        
        user_data = cursor.fetchone()
        user_info = {
            "name": f"{user_data[0]} {user_data[1]}" if user_data[0] else "User"
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
        
        today_stats = {
            "workouts_completed": workouts_today,
            "habits_logged": habits_today
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
        
        dashboard = {
            "user": user_info,
            "today": today_stats,
            "recent_workouts": recent_workouts,
            "active_goals": active_goals,
            "weekly_activity": weekly_activity
        }
        
        return jsonify({"success": True, "dashboard": dashboard}), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)