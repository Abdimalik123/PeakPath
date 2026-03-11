from flask import Blueprint, request, jsonify, current_app
from api.auth import login_required
from api.exercise_library import EXERCISE_LIBRARY

exercise_bank_bp = Blueprint('exercise_bank', __name__)


def _library_to_list():
    exercises = []
    for name, details in EXERCISE_LIBRARY.items():
        exercises.append({
            'id': name.replace(' ', '-'),
            'name': name.title(),
            'muscle_groups': details['muscle_groups'],
            'equipment': details['equipment'],
            'difficulty': details['difficulty'],
            'instructions': details['instructions'],
            'form_tips': details['form_tips'],
            'common_mistakes': details['common_mistakes'],
        })
    return exercises


@exercise_bank_bp.route('/exercise-bank', methods=['GET'])
@login_required
def get_exercise_bank():
    search = request.args.get('search', '').strip().lower()
    muscle = request.args.get('muscle', '').strip().lower()
    equipment = request.args.get('equipment', '').strip().lower()

    try:
        exercises = _library_to_list()

        if search:
            exercises = [ex for ex in exercises if search in ex['name'].lower()]

        if muscle:
            exercises = [ex for ex in exercises if any(muscle in m for m in ex['muscle_groups'])]

        if equipment:
            exercises = [ex for ex in exercises if equipment in ex['equipment'].lower()]

        exercises.sort(key=lambda ex: ex['name'])

        return jsonify({'success': True, 'exercises': exercises}), 200

    except Exception as e:
        current_app.logger.error(f'Error fetching exercise bank: {e}')
        return jsonify({'success': False, 'message': str(e)}), 500
