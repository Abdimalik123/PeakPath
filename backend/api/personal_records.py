from flask import Blueprint, jsonify, g, current_app
from sqlalchemy import func
from database import db
from models.personal_record import PersonalRecord
from models import Exercise
from models.workout import Workout
from models.workout_exercise import WorkoutExercise
from api.auth import login_required
from utils.pr_tracker import get_user_prs

pr_bp = Blueprint('pr_bp', __name__)


@pr_bp.route('/personal-records', methods=['GET'])
@login_required
def get_personal_records():
    """Get all personal records for the current user"""
    try:
        user_id = g.user['id']
        prs = get_user_prs(user_id)
        
        return jsonify({
            'success': True,
            'personal_records': prs,
            'count': len(prs)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching personal records: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch personal records'
        }), 500


@pr_bp.route('/personal-records/<int:exercise_id>', methods=['GET'])
@login_required
def get_exercise_pr(exercise_id):
    """Get personal record for a specific exercise"""
    try:
        user_id = g.user['id']
        prs = get_user_prs(user_id, exercise_id)
        
        if not prs:
            return jsonify({
                'success': True,
                'personal_record': None
            }), 200
        
        return jsonify({
            'success': True,
            'personal_record': prs[0]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching exercise PR: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch exercise PR'
        }), 500


@pr_bp.route('/analytics/exercise-progression/<int:exercise_id>', methods=['GET'])
@login_required
def get_exercise_progression(exercise_id):
    """Get exercise progression data for charts"""
    try:
        user_id = g.user['id']

        exercise = Exercise.query.get(exercise_id)
        if not exercise:
            return jsonify({
                'success': False,
                'message': 'Exercise not found'
            }), 404

        results = (
            db.session.query(
                Workout.date,
                WorkoutExercise.sets,
                WorkoutExercise.reps,
                WorkoutExercise.weight,
                WorkoutExercise.duration
            )
            .join(Workout, WorkoutExercise.workout_id == Workout.id)
            .filter(
                WorkoutExercise.exercise_id == exercise_id,
                Workout.user_id == user_id
            )
            .order_by(Workout.date.asc())
            .all()
        )

        progression = []
        for row in results:
            date, sets, reps, weight, duration = row
            sets_val = sets or 0
            reps_val = reps or 0
            weight_val = float(weight) if weight else 0.0
            volume = sets_val * reps_val * weight_val

            progression.append({
                'date': date.strftime('%Y-%m-%d') if date else None,
                'sets': sets_val,
                'reps': reps_val,
                'weight': weight_val,
                'volume': volume,
                'duration': duration
            })

        total_sessions = len(progression)

        if total_sessions > 0:
            weights = [p['weight'] for p in progression]
            reps_list = [p['reps'] for p in progression]
            volumes = [p['volume'] for p in progression]

            stats = {
                'total_sessions': total_sessions,
                'max_weight': max(weights),
                'avg_weight': round(sum(weights) / total_sessions, 1),
                'max_reps': max(reps_list),
                'avg_reps': round(sum(reps_list) / total_sessions, 1),
                'max_volume': max(volumes),
                'avg_volume': round(sum(volumes) / total_sessions, 1)
            }
        else:
            stats = {
                'total_sessions': 0,
                'max_weight': 0.0,
                'avg_weight': 0.0,
                'max_reps': 0,
                'avg_reps': 0.0,
                'max_volume': 0.0,
                'avg_volume': 0.0
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
