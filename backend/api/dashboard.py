from flask import Blueprint, request, jsonify, g, current_app
from database import db
from api.auth import login_required
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard_bp', __name__)


@dashboard_bp.route('/dashboard', methods=['GET'])
@login_required
def get_dashboard():
    user_id = g.user['id']
    
    try:
        with db.engine.connect() as conn:
            # User info
            result = conn.execute(
                db.text("""
                    SELECT u.firstname, u.lastname
                    FROM users u
                    WHERE u.id = :user_id
                """),
                {"user_id": user_id}
            )
            user_data = result.fetchone()
            
            if not user_data:
                return jsonify({"success": False, "message": "User not found"}), 404
            
            user_info = {
                "name": f"{user_data[0]} {user_data[1]}" if user_data[0] else "User"
            }
            
            # Today's stats
            today = datetime.now().date()
            
            result = conn.execute(
                db.text("SELECT COUNT(*) FROM workouts WHERE user_id = :user_id AND date = :today"),
                {"user_id": user_id, "today": today}
            )
            workouts_today = result.fetchone()[0]
            
            result = conn.execute(
                db.text("""
                    SELECT COUNT(*) FROM habit_logs hl
                    JOIN habits h ON hl.habit_id = h.id
                    WHERE h.user_id = :user_id AND DATE(hl.timestamp) = :today
                """),
                {"user_id": user_id, "today": today}
            )
            habits_today = result.fetchone()[0]
            
            today_stats = {
                "workouts_completed": workouts_today,
                "habits_logged": habits_today
            }
            
            # Recent workouts
            result = conn.execute(
                db.text("""
                    SELECT w.id, w.type, w.duration, w.date, COUNT(we.id) as exercise_count
                    FROM workouts w
                    LEFT JOIN workout_exercises we ON we.workout_id = w.id
                    WHERE w.user_id = :user_id
                    GROUP BY w.id
                    ORDER BY w.date DESC, w.created_at DESC
                    LIMIT 5
                """),
                {"user_id": user_id}
            )
            
            recent_workouts = [
                {"id": row[0], "type": row[1], "duration": row[2], "date": row[3], "exercise_count": row[4]}
                for row in result.fetchall()
            ]
            
            # Active goals
            result = conn.execute(
                db.text("""
                    SELECT id, name, type, target, progress, deadline
                    FROM goals WHERE user_id = :user_id AND progress < target
                    ORDER BY deadline ASC LIMIT 5
                """),
                {"user_id": user_id}
            )
            
            active_goals = []
            for row in result.fetchall():
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
                
                result = conn.execute(
                    db.text("SELECT COUNT(*) FROM workouts WHERE user_id = :user_id AND date = :day"),
                    {"user_id": user_id, "day": day}
                )
                workouts = result.fetchone()[0]
                
                result = conn.execute(
                    db.text("""
                        SELECT COUNT(*) FROM habit_logs hl
                        JOIN habits h ON hl.habit_id = h.id
                        WHERE h.user_id = :user_id AND DATE(hl.timestamp) = :day
                    """),
                    {"user_id": user_id, "day": day}
                )
                habits_count = result.fetchone()[0]
                
                weekly_activity.append({
                    "date": str(day), 
                    "workouts": workouts, 
                    "habits": habits_count
                })
            
            dashboard = {
                "user": user_info,
                "today": today_stats,
                "recent_workouts": recent_workouts,
                "active_goals": active_goals,
                "weekly_activity": weekly_activity
            }
            
            return jsonify({"success": True, "dashboard": dashboard}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching dashboard: {e}")
        return jsonify({"success": False, "message": str(e)}), 500