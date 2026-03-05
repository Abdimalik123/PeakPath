from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models.scheduled_workout import ScheduledWorkout
from api.auth import login_required
from datetime import datetime, date, timedelta

schedule_bp = Blueprint('schedule_bp', __name__)


@schedule_bp.route('/schedule', methods=['GET'])
@login_required
def get_schedule():
    """Get scheduled workouts for a date range"""
    user_id = g.user['id']
    start = request.args.get('start')
    end = request.args.get('end')

    try:
        query = ScheduledWorkout.query.filter_by(user_id=user_id)

        if start:
            query = query.filter(ScheduledWorkout.scheduled_date >= start)
        if end:
            query = query.filter(ScheduledWorkout.scheduled_date <= end)

        schedules = query.order_by(ScheduledWorkout.scheduled_date.asc()).all()

        return jsonify({
            'success': True,
            'scheduled_workouts': [s.to_dict() for s in schedules]
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching schedule: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch schedule'}), 500


@schedule_bp.route('/schedule', methods=['POST'])
@login_required
def create_scheduled_workout():
    """Schedule a future workout"""
    user_id = g.user['id']
    data = request.get_json()

    title = data.get('title')
    scheduled_date = data.get('scheduled_date')

    if not title or not scheduled_date:
        return jsonify({'success': False, 'message': 'Title and date are required'}), 400

    try:
        scheduled = ScheduledWorkout(
            user_id=user_id,
            title=title,
            scheduled_date=scheduled_date,
            scheduled_time=data.get('scheduled_time'),
            workout_type=data.get('workout_type'),
            duration_planned=data.get('duration_planned'),
            notes=data.get('notes')
        )
        db.session.add(scheduled)
        db.session.commit()

        return jsonify({
            'success': True,
            'scheduled_workout': scheduled.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating scheduled workout: {e}")
        return jsonify({'success': False, 'message': 'Failed to schedule workout'}), 500


@schedule_bp.route('/schedule/<int:schedule_id>', methods=['PUT'])
@login_required
def update_scheduled_workout(schedule_id):
    """Update a scheduled workout"""
    user_id = g.user['id']
    data = request.get_json()

    try:
        scheduled = ScheduledWorkout.query.filter_by(id=schedule_id, user_id=user_id).first()
        if not scheduled:
            return jsonify({'success': False, 'message': 'Scheduled workout not found'}), 404

        if 'title' in data:
            scheduled.title = data['title']
        if 'scheduled_date' in data:
            scheduled.scheduled_date = data['scheduled_date']
        if 'scheduled_time' in data:
            scheduled.scheduled_time = data['scheduled_time']
        if 'workout_type' in data:
            scheduled.workout_type = data['workout_type']
        if 'duration_planned' in data:
            scheduled.duration_planned = data['duration_planned']
        if 'notes' in data:
            scheduled.notes = data['notes']
        if 'completed' in data:
            scheduled.completed = data['completed']
        if 'workout_id' in data:
            scheduled.workout_id = data['workout_id']

        db.session.commit()

        return jsonify({
            'success': True,
            'scheduled_workout': scheduled.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating scheduled workout: {e}")
        return jsonify({'success': False, 'message': 'Failed to update'}), 500


@schedule_bp.route('/schedule/<int:schedule_id>', methods=['DELETE'])
@login_required
def delete_scheduled_workout(schedule_id):
    """Delete a scheduled workout"""
    user_id = g.user['id']

    try:
        scheduled = ScheduledWorkout.query.filter_by(id=schedule_id, user_id=user_id).first()
        if not scheduled:
            return jsonify({'success': False, 'message': 'Scheduled workout not found'}), 404

        db.session.delete(scheduled)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Scheduled workout deleted'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting scheduled workout: {e}")
        return jsonify({'success': False, 'message': 'Failed to delete'}), 500
