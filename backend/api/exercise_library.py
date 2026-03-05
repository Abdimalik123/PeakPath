from flask import Blueprint, jsonify, g, current_app
from database import db
from models import Exercise
from api.auth import login_required

exercise_library_bp = Blueprint('exercise_library_bp', __name__)

# Common exercise instructions and form tips
EXERCISE_LIBRARY = {
    'bench press': {
        'muscle_groups': ['chest', 'triceps', 'shoulders'],
        'equipment': 'barbell',
        'difficulty': 'intermediate',
        'instructions': [
            'Lie flat on bench with feet firmly on the ground',
            'Grip the bar slightly wider than shoulder-width',
            'Lower the bar to mid-chest in a controlled manner',
            'Press the bar back up to starting position',
            'Keep your shoulder blades retracted throughout'
        ],
        'form_tips': [
            'Keep your core tight and back slightly arched',
            'Don\'t bounce the bar off your chest',
            'Maintain control throughout the entire movement',
            'Breathe in on the way down, out on the way up'
        ],
        'common_mistakes': [
            'Flaring elbows too wide',
            'Lifting hips off the bench',
            'Not using full range of motion'
        ]
    },
    'squat': {
        'muscle_groups': ['quads', 'glutes', 'hamstrings', 'core'],
        'equipment': 'barbell',
        'difficulty': 'intermediate',
        'instructions': [
            'Position bar on upper back, feet shoulder-width apart',
            'Break at the hips and knees simultaneously',
            'Lower until thighs are parallel to ground',
            'Drive through heels to return to standing',
            'Keep chest up and core engaged'
        ],
        'form_tips': [
            'Keep knees tracking over toes',
            'Maintain neutral spine throughout',
            'Go as deep as mobility allows with good form',
            'Don\'t let knees cave inward'
        ],
        'common_mistakes': [
            'Knees caving inward',
            'Rounding the lower back',
            'Rising onto toes'
        ]
    },
    'deadlift': {
        'muscle_groups': ['back', 'glutes', 'hamstrings', 'core'],
        'equipment': 'barbell',
        'difficulty': 'advanced',
        'instructions': [
            'Stand with feet hip-width, bar over mid-foot',
            'Bend at hips and knees to grip the bar',
            'Keep back straight, chest up, shoulders back',
            'Drive through heels, extending hips and knees',
            'Stand fully upright, then lower with control'
        ],
        'form_tips': [
            'Keep the bar close to your body throughout',
            'Engage lats by "bending the bar"',
            'Hinge at the hips, not the lower back',
            'Lock out hips and knees simultaneously at top'
        ],
        'common_mistakes': [
            'Rounding the back',
            'Starting with hips too low or too high',
            'Jerking the bar off the ground'
        ]
    },
    'pull-up': {
        'muscle_groups': ['back', 'biceps', 'shoulders'],
        'equipment': 'pull-up bar',
        'difficulty': 'intermediate',
        'instructions': [
            'Hang from bar with hands slightly wider than shoulders',
            'Pull yourself up until chin is over the bar',
            'Lower yourself with control to full extension',
            'Avoid swinging or using momentum',
            'Engage core throughout the movement'
        ],
        'form_tips': [
            'Start from a dead hang for full range of motion',
            'Lead with your chest, not your chin',
            'Squeeze shoulder blades together at the top',
            'Control the descent - don\'t just drop'
        ],
        'common_mistakes': [
            'Using momentum/kipping',
            'Not going to full extension',
            'Shrugging shoulders at the top'
        ]
    },
    'push-up': {
        'muscle_groups': ['chest', 'triceps', 'shoulders', 'core'],
        'equipment': 'bodyweight',
        'difficulty': 'beginner',
        'instructions': [
            'Start in plank position, hands shoulder-width apart',
            'Lower body until chest nearly touches ground',
            'Keep elbows at 45-degree angle to body',
            'Push back up to starting position',
            'Maintain straight line from head to heels'
        ],
        'form_tips': [
            'Keep core engaged throughout',
            'Don\'t let hips sag or pike up',
            'Full range of motion is key',
            'Breathe in going down, out going up'
        ],
        'common_mistakes': [
            'Sagging hips',
            'Flaring elbows out too wide',
            'Not going low enough'
        ]
    },
    'overhead press': {
        'muscle_groups': ['shoulders', 'triceps', 'core'],
        'equipment': 'barbell',
        'difficulty': 'intermediate',
        'instructions': [
            'Start with bar at shoulder height, hands just outside shoulders',
            'Press bar straight up overhead',
            'Lock out arms at the top',
            'Lower bar with control back to shoulders',
            'Keep core tight throughout'
        ],
        'form_tips': [
            'Don\'t lean back excessively',
            'Press the bar in a straight line',
            'Squeeze glutes to protect lower back',
            'Full lockout at the top'
        ],
        'common_mistakes': [
            'Excessive back arch',
            'Pressing the bar forward instead of up',
            'Not achieving full lockout'
        ]
    },
    'plank': {
        'muscle_groups': ['core', 'shoulders', 'back'],
        'equipment': 'bodyweight',
        'difficulty': 'beginner',
        'instructions': [
            'Start in forearm plank position',
            'Keep body in straight line from head to heels',
            'Engage core and glutes',
            'Hold position for desired time',
            'Breathe normally throughout'
        ],
        'form_tips': [
            'Don\'t let hips sag or pike up',
            'Keep neck neutral, looking at the ground',
            'Squeeze glutes and core',
            'Focus on quality over duration'
        ],
        'common_mistakes': [
            'Sagging hips',
            'Holding breath',
            'Looking forward instead of down'
        ]
    }
}


@exercise_library_bp.route('/exercise-library/search', methods=['GET'])
@login_required
def search_exercise_library():
    """Search the exercise library for instructions and tips"""
    try:
        from flask import request
        query = request.args.get('q', '').lower().strip()
        
        if not query:
            return jsonify({
                'success': False,
                'message': 'Search query required'
            }), 400
        
        # Search for matching exercises
        results = []
        for exercise_name, details in EXERCISE_LIBRARY.items():
            if query in exercise_name.lower():
                results.append({
                    'name': exercise_name.title(),
                    'muscle_groups': details['muscle_groups'],
                    'equipment': details['equipment'],
                    'difficulty': details['difficulty'],
                    'instructions': details['instructions'],
                    'form_tips': details['form_tips'],
                    'common_mistakes': details['common_mistakes']
                })
        
        return jsonify({
            'success': True,
            'results': results,
            'count': len(results)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error searching exercise library: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to search exercise library'
        }), 500


@exercise_library_bp.route('/exercise-library/all', methods=['GET'])
@login_required
def get_all_exercises():
    """Get all exercises in the library"""
    try:
        exercises = []
        for exercise_name, details in EXERCISE_LIBRARY.items():
            exercises.append({
                'name': exercise_name.title(),
                'muscle_groups': details['muscle_groups'],
                'equipment': details['equipment'],
                'difficulty': details['difficulty'],
                'instructions': details['instructions'],
                'form_tips': details['form_tips'],
                'common_mistakes': details['common_mistakes']
            })
        
        return jsonify({
            'success': True,
            'exercises': exercises,
            'count': len(exercises)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching exercise library: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch exercise library'
        }), 500


@exercise_library_bp.route('/exercise-library/<exercise_name>', methods=['GET'])
@login_required
def get_exercise_details(exercise_name):
    """Get detailed information about a specific exercise"""
    try:
        exercise_key = exercise_name.lower().strip()
        
        if exercise_key not in EXERCISE_LIBRARY:
            return jsonify({
                'success': False,
                'message': 'Exercise not found in library'
            }), 404
        
        details = EXERCISE_LIBRARY[exercise_key]
        
        return jsonify({
            'success': True,
            'exercise': {
                'name': exercise_name.title(),
                'muscle_groups': details['muscle_groups'],
                'equipment': details['equipment'],
                'difficulty': details['difficulty'],
                'instructions': details['instructions'],
                'form_tips': details['form_tips'],
                'common_mistakes': details['common_mistakes']
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching exercise details: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch exercise details'
        }), 500
