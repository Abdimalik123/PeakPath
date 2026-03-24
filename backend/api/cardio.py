from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models.cardio_workout import CardioWorkout
from api.auth import login_required
from datetime import datetime
from utils.validators import validate_request, CardioSchema

cardio_bp = Blueprint('cardio_bp', __name__)


@cardio_bp.route('/cardio', methods=['POST'])
@login_required
@validate_request(CardioSchema)
def log_cardio():
    """Log a cardio workout"""
    try:
        data = request.validated_data
        user_id = g.user['id']

        distance = data.get('distance')
        duration = data.get('duration')
        pace = data.get('pace')
        calories = data.get('calories')

        # Calculate pace if distance and duration provided but no pace
        if not pace and distance and duration and distance > 0:
            pace = duration / distance  # min/km

        # Parse date
        workout_date = datetime.utcnow()
        if data.get('date'):
            try:
                workout_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
            except Exception:
                try:
                    workout_date = datetime.strptime(data['date'], '%Y-%m-%d')
                except Exception:
                    pass

        cardio = CardioWorkout(
            user_id=user_id,
            cardio_type=data.get('cardio_type', 'running'),
            distance=distance,
            duration=duration,
            pace=pace,
            calories=calories,
            heart_rate_avg=data.get('heart_rate_avg'),
            heart_rate_max=data.get('heart_rate_max'),
            elevation_gain=data.get('elevation_gain'),
            notes=data.get('notes', ''),
            date=workout_date
        )

        db.session.add(cardio)
        db.session.commit()

        from utils.gamification_helper import award_points
        points = 30
        if distance:
            points += int(distance * 5)
        award_points(user_id, "cardio_workout", points=points, entity_type="cardio", entity_id=cardio.id)

        return jsonify({
            'success': True,
            'cardio': cardio.to_dict(),
            'points_earned': points
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error logging cardio: {e}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': str(e)}), 500


@cardio_bp.route('/cardio', methods=['GET'])
@login_required
def get_cardio_workouts():
    """Get user's cardio workout history"""
    try:
        user_id = g.user['id']
        limit = request.args.get('limit', 50, type=int)
        
        workouts = CardioWorkout.query.filter_by(
            user_id=user_id
        ).order_by(CardioWorkout.date.desc()).limit(limit).all()
        
        return jsonify({
            'success': True,
            'workouts': [w.to_dict() for w in workouts]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching cardio workouts: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch workouts'}), 500


@cardio_bp.route('/cardio/<int:cardio_id>', methods=['GET'])
@login_required
def get_cardio_workout(cardio_id):
    """Get specific cardio workout"""
    try:
        user_id = g.user['id']
        
        cardio = CardioWorkout.query.filter_by(
            id=cardio_id,
            user_id=user_id
        ).first()
        
        if not cardio:
            return jsonify({'success': False, 'message': 'Cardio workout not found'}), 404
        
        return jsonify({
            'success': True,
            'cardio': cardio.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching cardio workout: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch workout'}), 500


@cardio_bp.route('/cardio/<int:cardio_id>', methods=['DELETE'])
@login_required
def delete_cardio_workout(cardio_id):
    """Delete a cardio workout"""
    try:
        user_id = g.user['id']
        
        cardio = CardioWorkout.query.filter_by(
            id=cardio_id,
            user_id=user_id
        ).first()
        
        if not cardio:
            return jsonify({'success': False, 'message': 'Cardio workout not found'}), 404
        
        db.session.delete(cardio)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Cardio workout deleted'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting cardio workout: {e}")
        return jsonify({'success': False, 'message': 'Failed to delete workout'}), 500


@cardio_bp.route('/cardio/stats', methods=['GET'])
@login_required
def get_cardio_stats():
    """Get cardio statistics"""
    try:
        user_id = g.user['id']
        
        workouts = CardioWorkout.query.filter_by(user_id=user_id).all()
        
        total_distance = sum(w.distance for w in workouts if w.distance)
        total_duration = sum(w.duration for w in workouts if w.duration)
        total_workouts = len(workouts)
        
        # Calculate averages
        avg_distance = total_distance / total_workouts if total_workouts > 0 else 0
        avg_duration = total_duration / total_workouts if total_workouts > 0 else 0
        avg_pace = sum(w.pace for w in workouts if w.pace) / total_workouts if total_workouts > 0 else 0
        
        # Get best performances
        best_distance = max((w.distance for w in workouts if w.distance), default=0)
        best_pace = min((w.pace for w in workouts if w.pace), default=0)
        
        return jsonify({
            'success': True,
            'stats': {
                'total_workouts': total_workouts,
                'total_distance': round(total_distance, 2),
                'total_duration': total_duration,
                'avg_distance': round(avg_distance, 2),
                'avg_duration': round(avg_duration, 2),
                'avg_pace': round(avg_pace, 2),
                'best_distance': round(best_distance, 2),
                'best_pace': round(best_pace, 2)
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching cardio stats: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch stats'}), 500
