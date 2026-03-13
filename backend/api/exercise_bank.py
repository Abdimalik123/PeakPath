from flask import Blueprint, request, jsonify, current_app
from api.auth import login_required
from api.exercise_library import EXERCISE_LIBRARY
from database import db
from models import Exercise

exercise_bank_bp = Blueprint('exercise_bank', __name__)


@exercise_bank_bp.route('/exercise-bank', methods=['GET'])
@login_required
def get_exercise_bank():
    search = request.args.get('search', '').strip()
    muscle = request.args.get('muscle', '').strip().lower()
    equipment = request.args.get('equipment', '').strip().lower()

    try:
        query = Exercise.query.filter(Exercise.is_global == True)

        if search:
            query = query.filter(Exercise.name.ilike(f'%{search}%'))
        if muscle:
            query = query.filter(Exercise.muscle_group.ilike(f'%{muscle}%'))
        if equipment:
            query = query.filter(Exercise.equipment.ilike(f'%{equipment}%'))

        exercises = query.order_by(Exercise.name).all()

        result = []
        for ex in exercises:
            lib_data = EXERCISE_LIBRARY.get(ex.name.lower().strip(), {})

            raw_muscle = ex.muscle_group or ''
            muscle_groups = [m.strip() for m in raw_muscle.split(',') if m.strip()]

            result.append({
                'id': str(ex.id),
                'name': ex.name,
                'category': ex.category or '',
                'muscle_groups': muscle_groups,
                'equipment': ex.equipment or '',
                'difficulty': lib_data.get('difficulty', ''),
                'setup': lib_data.get('setup', []),
                'lifting': lib_data.get('lifting', []),
                'lowering': lib_data.get('lowering', []),
                'completion': lib_data.get('completion', []),
            })

        return jsonify({'success': True, 'exercises': result}), 200

    except Exception as e:
        current_app.logger.error(f'Error fetching exercise bank: {e}')
        return jsonify({'success': False, 'message': str(e)}), 500
