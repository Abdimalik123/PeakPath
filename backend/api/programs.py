from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models.workout_program import WorkoutProgram, ProgramWorkout, ProgramExercise, ProgramEnrollment
from api.auth import login_required
from datetime import date, datetime

programs_bp = Blueprint('programs_bp', __name__)


@programs_bp.route('/programs', methods=['GET'])
@login_required
def get_programs():
    """Get all public workout programs"""
    try:
        programs = WorkoutProgram.query.filter_by(is_public=True).all()
        return jsonify({
            'success': True,
            'programs': [p.to_dict() for p in programs]
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching programs: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch programs'}), 500


@programs_bp.route('/programs/<int:program_id>', methods=['GET'])
@login_required
def get_program_details(program_id):
    """Get detailed program information including all workouts"""
    try:
        program = WorkoutProgram.query.get(program_id)
        if not program:
            return jsonify({'success': False, 'message': 'Program not found'}), 404
        
        program_dict = program.to_dict()
        program_dict['workouts'] = [w.to_dict() for w in program.workouts]
        
        # Check if user is enrolled
        enrollment = ProgramEnrollment.query.filter_by(
            user_id=g.user['id'],
            program_id=program_id,
            status='active'
        ).first()
        
        program_dict['is_enrolled'] = enrollment is not None
        if enrollment:
            program_dict['enrollment'] = enrollment.to_dict()
        
        return jsonify({
            'success': True,
            'program': program_dict
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching program details: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch program'}), 500


@programs_bp.route('/programs/<int:program_id>/enroll', methods=['POST'])
@login_required
def enroll_program(program_id):
    """Enroll in a workout program"""
    try:
        user_id = g.user['id']
        
        # Check if already enrolled
        existing = ProgramEnrollment.query.filter_by(
            user_id=user_id,
            program_id=program_id,
            status='active'
        ).first()
        
        if existing:
            return jsonify({'success': False, 'message': 'Already enrolled in this program'}), 400
        
        enrollment = ProgramEnrollment(
            user_id=user_id,
            program_id=program_id,
            start_date=date.today(),
            current_week=1,
            current_day=1,
            status='active'
        )
        
        db.session.add(enrollment)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Enrolled successfully',
            'enrollment': enrollment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error enrolling in program: {e}")
        return jsonify({'success': False, 'message': 'Failed to enroll'}), 500


@programs_bp.route('/programs/my-enrollments', methods=['GET'])
@login_required
def get_my_enrollments():
    """Get user's active program enrollments"""
    try:
        user_id = g.user['id']
        
        enrollments = ProgramEnrollment.query.filter_by(
            user_id=user_id,
            status='active'
        ).all()
        
        result = []
        for e in enrollments:
            enrollment_dict = e.to_dict()
            enrollment_dict['program'] = e.program.to_dict()
            result.append(enrollment_dict)
        
        return jsonify({
            'success': True,
            'enrollments': result
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching enrollments: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch enrollments'}), 500


@programs_bp.route('/programs/enrollments/<int:enrollment_id>/progress', methods=['PUT'])
@login_required
def update_enrollment_progress(enrollment_id):
    """Update enrollment progress (advance to next day/week)"""
    try:
        user_id = g.user['id']
        data = request.get_json()
        
        enrollment = ProgramEnrollment.query.filter_by(
            id=enrollment_id,
            user_id=user_id
        ).first()
        
        if not enrollment:
            return jsonify({'success': False, 'message': 'Enrollment not found'}), 404
        
        # Update progress
        if data.get('advance_day'):
            enrollment.current_day += 1
            
            # Check if need to advance week
            if enrollment.current_day > enrollment.program.workouts_per_week:
                enrollment.current_day = 1
                enrollment.current_week += 1
                
                # Check if program completed
                if enrollment.current_week > enrollment.program.duration_weeks:
                    enrollment.status = 'completed'
                    enrollment.completed_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'enrollment': enrollment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating enrollment progress: {e}")
        return jsonify({'success': False, 'message': 'Failed to update progress'}), 500


@programs_bp.route('/programs/<int:program_id>/current-workout', methods=['GET'])
@login_required
def get_current_workout(program_id):
    """Get the current workout for user's enrollment"""
    try:
        user_id = g.user['id']
        
        enrollment = ProgramEnrollment.query.filter_by(
            user_id=user_id,
            program_id=program_id,
            status='active'
        ).first()
        
        if not enrollment:
            return jsonify({'success': False, 'message': 'Not enrolled in this program'}), 404
        
        # Get current workout
        current_workout = ProgramWorkout.query.filter_by(
            program_id=program_id,
            week_number=enrollment.current_week,
            day_number=enrollment.current_day
        ).first()
        
        if not current_workout:
            return jsonify({'success': False, 'message': 'No workout found for current day'}), 404
        
        return jsonify({
            'success': True,
            'workout': current_workout.to_dict(),
            'enrollment': enrollment.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching current workout: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch workout'}), 500
