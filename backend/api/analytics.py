from flask import Blueprint, jsonify, g, current_app
from database import db
from models import Workout, HabitLog, Goal, UserPoint, PointTransaction
from api.auth import login_required
from datetime import datetime, timedelta
from sqlalchemy import func

analytics_bp = Blueprint('analytics_bp', __name__)


@analytics_bp.route('/analytics/weekly-overview', methods=['GET'])
@login_required
def get_weekly_overview():
    """Get weekly overview stats for the dashboard"""
    try:
        user_id = g.user['id']
        today = datetime.now().date()
        week_ago = today - timedelta(days=7)
        
        # Workout stats
        workouts_this_week = Workout.query.filter(
            Workout.user_id == user_id,
            Workout.date >= week_ago,
            Workout.date <= today
        ).count()
        
        total_workout_duration = db.session.query(
            func.sum(Workout.duration)
        ).filter(
            Workout.user_id == user_id,
            Workout.date >= week_ago,
            Workout.date <= today
        ).scalar() or 0
        
        # Habit stats
        habits_completed = HabitLog.query.join(HabitLog.habit).filter(
            HabitLog.habit.has(user_id=user_id),
            HabitLog.completed == True,
            HabitLog.timestamp >= week_ago
        ).count()
        
        # Goal stats
        active_goals = Goal.query.filter(
            Goal.user_id == user_id,
            Goal.progress < Goal.target
        ).count()
        
        completed_goals_this_week = Goal.query.filter(
            Goal.user_id == user_id,
            Goal.progress >= Goal.target,
            Goal.updated_at >= week_ago
        ).count()
        
        # Points earned this week
        points_this_week = db.session.query(
            func.sum(PointTransaction.points)
        ).filter(
            PointTransaction.user_id == user_id,
            PointTransaction.created_at >= week_ago
        ).scalar() or 0
        
        # User level and total points
        user_points = UserPoint.query.filter_by(user_id=user_id).first()
        
        # Calculate workout streak
        streak = _calculate_workout_streak(user_id)
        
        return jsonify({
            'success': True,
            'overview': {
                'workouts_this_week': workouts_this_week,
                'total_workout_duration': int(total_workout_duration),
                'habits_completed': habits_completed,
                'active_goals': active_goals,
                'completed_goals_this_week': completed_goals_this_week,
                'points_this_week': int(points_this_week),
                'current_level': user_points.level if user_points else 1,
                'total_points': user_points.total_points if user_points else 0,
                'points_to_next_level': user_points.points_to_next_level if user_points else 100,
                'workout_streak': streak,
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching weekly overview: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch overview'}), 500


def _calculate_workout_streak(user_id):
    """Calculate current workout streak (consecutive days with workouts)"""
    try:
        today = datetime.now().date()
        streak = 0
        current_date = today
        
        # Check backwards from today
        while True:
            workout_exists = Workout.query.filter(
                Workout.user_id == user_id,
                Workout.date == current_date
            ).first()
            
            if workout_exists:
                streak += 1
                current_date -= timedelta(days=1)
            else:
                # Allow one rest day if we're not on the first day
                if streak > 0 and current_date == today - timedelta(days=1):
                    current_date -= timedelta(days=1)
                    continue
                break
            
            # Limit to prevent infinite loops
            if streak > 365:
                break
                
        return streak
    except Exception:
        return 0


@analytics_bp.route('/analytics/workout-history', methods=['GET'])
@login_required
def get_workout_history():
    """Get workout frequency over the last 30 days"""
    try:
        user_id = g.user['id']
        today = datetime.now().date()
        thirty_days_ago = today - timedelta(days=30)
        
        # Get workouts grouped by date
        workouts = db.session.query(
            Workout.date,
            func.count(Workout.id).label('count'),
            func.sum(Workout.duration).label('total_duration')
        ).filter(
            Workout.user_id == user_id,
            Workout.date >= thirty_days_ago,
            Workout.date <= today
        ).group_by(Workout.date).all()
        
        # Create a complete date range
        date_range = []
        current = thirty_days_ago
        while current <= today:
            date_range.append(current)
            current += timedelta(days=1)
        
        # Map workouts to dates
        workout_map = {w.date: {'count': w.count, 'duration': int(w.total_duration or 0)} for w in workouts}
        
        history = []
        for date in date_range:
            data = workout_map.get(date, {'count': 0, 'duration': 0})
            history.append({
                'date': date.isoformat(),
                'workouts': data['count'],
                'duration': data['duration']
            })
        
        return jsonify({'success': True, 'history': history}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching workout history: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch history'}), 500


@analytics_bp.route('/analytics/last-workout/<workout_type>', methods=['GET'])
@login_required
def get_last_workout_by_type(workout_type):
    """Get the most recent workout of a specific type with exercise details"""
    try:
        user_id = g.user['id']
        from models import WorkoutExercise, Exercise
        
        # Find the most recent workout of this type
        last_workout = Workout.query.filter(
            Workout.user_id == user_id,
            Workout.type.ilike(f"%{workout_type}%")
        ).order_by(Workout.date.desc()).first()
        
        if not last_workout:
            return jsonify({
                'success': True,
                'last_workout': None
            }), 200
        
        # Get exercises for this workout
        exercises = []
        workout_exercises = WorkoutExercise.query.filter_by(
            workout_id=last_workout.id
        ).all()
        
        for we in workout_exercises:
            exercise = Exercise.query.get(we.exercise_id)
            if exercise:
                exercises.append({
                    'name': exercise.name,
                    'sets': we.sets,
                    'reps': we.reps,
                    'weight': float(we.weight) if we.weight else None,
                    'duration': we.duration,
                    'notes': we.notes
                })
        
        return jsonify({
            'success': True,
            'last_workout': {
                'id': last_workout.id,
                'type': last_workout.type,
                'date': last_workout.date.isoformat(),
                'duration': last_workout.duration,
                'notes': last_workout.notes,
                'exercises': exercises
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching last workout: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch last workout'}), 500


@analytics_bp.route('/analytics/exercise-progression/<int:exercise_id>', methods=['GET'])
@login_required
def get_exercise_progression(exercise_id):
    """Get progression data for a specific exercise over time"""
    try:
        user_id = g.user['id']
        from models import WorkoutExercise, Exercise
        
        # Verify exercise exists
        exercise = Exercise.query.get(exercise_id)
        if not exercise:
            return jsonify({
                'success': False,
                'message': 'Exercise not found'
            }), 404
        
        # Get all workout exercises for this exercise, ordered by date
        workout_exercises = db.session.query(
            WorkoutExercise, Workout.date
        ).join(
            Workout, WorkoutExercise.workout_id == Workout.id
        ).filter(
            Workout.user_id == user_id,
            WorkoutExercise.exercise_id == exercise_id
        ).order_by(Workout.date.asc()).all()
        
        if not workout_exercises:
            return jsonify({
                'success': True,
                'exercise_name': exercise.name,
                'progression': []
            }), 200
        
        # Build progression data
        progression = []
        for we, date in workout_exercises:
            progression.append({
                'date': date.isoformat(),
                'sets': we.sets,
                'reps': we.reps,
                'weight': float(we.weight) if we.weight else None,
                'volume': float(we.weight * we.reps * we.sets) if we.weight and we.reps and we.sets else None,
                'duration': we.duration
            })
        
        # Calculate statistics
        weights = [p['weight'] for p in progression if p['weight']]
        reps = [p['reps'] for p in progression if p['reps']]
        volumes = [p['volume'] for p in progression if p['volume']]
        
        stats = {
            'total_sessions': len(progression),
            'max_weight': max(weights) if weights else None,
            'avg_weight': sum(weights) / len(weights) if weights else None,
            'max_reps': max(reps) if reps else None,
            'avg_reps': sum(reps) / len(reps) if reps else None,
            'max_volume': max(volumes) if volumes else None,
            'avg_volume': sum(volumes) / len(volumes) if volumes else None
        }
        
        return jsonify({
            'success': True,
            'exercise_name': exercise.name,
            'progression': progression,
            'stats': stats
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching exercise progression: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch exercise progression'
        }), 500
