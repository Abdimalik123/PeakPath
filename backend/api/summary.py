from flask import Blueprint, request, jsonify, g, current_app
from database import db
from api.auth import login_required
from datetime import datetime, timedelta

summary_bp = Blueprint('summary_bp', __name__)


@summary_bp.route('/summary/weekly', methods=['GET'])
@login_required
def get_weekly_summary():
    user_id = g.user['id']
    week_offset = request.args.get('week_offset', 0, type=int)
    
    try:
        with db.engine.connect() as conn:
            # Calculate week bounds
            today = datetime.now().date()
            week_start = today - timedelta(days=today.weekday()) + timedelta(weeks=week_offset)
            week_end = week_start + timedelta(days=6)
            week_number = week_start.isocalendar()[1]
            
            # Workout summary
            result = conn.execute(
                db.text("""
                    SELECT 
                        COUNT(*) as total_workouts,
                        COALESCE(SUM(duration), 0) as total_duration,
                        type,
                        COUNT(*) as type_count
                    FROM workouts
                    WHERE user_id = :user_id AND date >= :week_start AND date <= :week_end
                    GROUP BY type
                """),
                {"user_id": user_id, "week_start": week_start, "week_end": week_end}
            )
            
            workout_data = result.fetchall()
            total_workouts = sum(row[3] for row in workout_data)
            total_duration = sum(row[1] for row in workout_data) if workout_data else 0
            workout_types = {row[2]: row[3] for row in workout_data if row[2]}
            
            # Habit summary
            result = conn.execute(
                db.text("""
                    SELECT h.id, h.name, h.frequency, COUNT(hl.id) as logs_count
                    FROM habits h
                    LEFT JOIN habit_logs hl ON hl.habit_id = h.id 
                        AND hl.timestamp >= :week_start AND hl.timestamp <= :week_end
                    WHERE h.user_id = :user_id
                    GROUP BY h.id, h.name, h.frequency
                """),
                {"user_id": user_id, "week_start": week_start, "week_end": week_end}
            )
            
            habit_data = result.fetchall()
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
            
            # Calculate completion rate
            expected_logs = len(habit_data) * 7
            completion_rate = round((total_habits_logged / expected_logs * 100), 1) if expected_logs > 0 else 0
            
            # Goals progress
            result = conn.execute(
                db.text("""
                    SELECT id, name, type, target, progress, deadline
                    FROM goals
                    WHERE user_id = :user_id AND progress < target
                """),
                {"user_id": user_id}
            )
            
            goals_data = result.fetchall()
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
            result = conn.execute(
                db.text("""
                    SELECT weight_kg, date
                    FROM weight_logs
                    WHERE user_id = :user_id AND date >= :week_start AND date <= :week_end
                    ORDER BY date ASC
                """),
                {"user_id": user_id, "week_start": week_start, "week_end": week_end}
            )
            
            weight_logs = result.fetchall()
            weight_start = weight_logs[0][0] if weight_logs else None
            weight_end = weight_logs[-1][0] if weight_logs else None
            weight_change = round(float(weight_end) - float(weight_start), 1) if weight_start and weight_end else None
            
            # Points earned this week
            result = conn.execute(
                db.text("""
                    SELECT COALESCE(SUM(points), 0)
                    FROM point_transactions
                    WHERE user_id = :user_id AND created_at >= :week_start AND created_at <= :week_end
                """),
                {"user_id": user_id, "week_start": week_start, "week_end": week_end}
            )
            
            points_earned = result.fetchone()[0]
            
            # Achievements earned this week
            result = conn.execute(
                db.text("""
                    SELECT achievement_name, description, earned_at
                    FROM user_achievements
                    WHERE user_id = :user_id AND earned_at >= :week_start AND earned_at <= :week_end
                """),
                {"user_id": user_id, "week_start": week_start, "week_end": week_end}
            )
            
            achievements = [
                {"name": row[0], "description": row[1], "earned_at": row[2]}
                for row in result.fetchall()
            ]
            
            # Daily breakdown
            daily_activity = []
            for i in range(7):
                day_date = week_start + timedelta(days=i)
                
                result = conn.execute(
                    db.text("""
                        SELECT COUNT(*) FROM workouts
                        WHERE user_id = :user_id AND date = :day_date
                    """),
                    {"user_id": user_id, "day_date": day_date}
                )
                workouts_count = result.fetchone()[0]
                
                result = conn.execute(
                    db.text("""
                        SELECT COUNT(*) FROM habit_logs hl
                        JOIN habits h ON hl.habit_id = h.id
                        WHERE h.user_id = :user_id AND DATE(hl.timestamp) = :day_date
                    """),
                    {"user_id": user_id, "day_date": day_date}
                )
                habits_count = result.fetchone()[0]
                
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
                        "start": float(weight_start) if weight_start else None,
                        "end": float(weight_end) if weight_end else None,
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
        current_app.logger.error(f"Error fetching weekly summary: {e}")
        return jsonify({"success": False, "message": str(e)}), 500