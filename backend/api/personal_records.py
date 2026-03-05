from flask import Blueprint, jsonify, g, current_app
from database import db
from models.personal_record import PersonalRecord
from models import Exercise
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
