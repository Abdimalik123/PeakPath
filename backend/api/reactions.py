from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models.activity_reaction import ActivityReaction
from models import User
from api.auth import login_required

reactions_bp = Blueprint('reactions_bp', __name__)


@reactions_bp.route('/activities/<int:activity_id>/react', methods=['POST'])
@login_required
def add_reaction(activity_id):
    """Add or toggle a reaction to an activity"""
    try:
        data = request.get_json()
        reaction_type = data.get('reaction_type')  # 'strong', 'fire', 'clap', 'wow', 'heart'
        user_id = g.user['id']
        
        if reaction_type not in ['strong', 'fire', 'clap', 'wow', 'heart']:
            return jsonify({'success': False, 'message': 'Invalid reaction type'}), 400
        
        # Check if user already reacted with this type
        existing = ActivityReaction.query.filter_by(
            activity_id=activity_id,
            user_id=user_id,
            reaction_type=reaction_type
        ).first()
        
        if existing:
            # Remove reaction (toggle off)
            db.session.delete(existing)
            db.session.commit()
            return jsonify({'success': True, 'action': 'removed'}), 200
        
        # Add new reaction
        reaction = ActivityReaction(
            activity_id=activity_id,
            user_id=user_id,
            reaction_type=reaction_type
        )
        db.session.add(reaction)
        db.session.commit()
        
        return jsonify({'success': True, 'action': 'added'}), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding reaction: {e}")
        return jsonify({'success': False, 'message': 'Failed to add reaction'}), 500


@reactions_bp.route('/activities/<int:activity_id>/reactions', methods=['GET'])
@login_required
def get_reactions(activity_id):
    """Get all reactions for an activity"""
    try:
        user_id = g.user['id']
        reactions = ActivityReaction.query.filter_by(activity_id=activity_id).all()
        
        # Group by type with counts
        grouped = {}
        user_reactions = []
        
        for r in reactions:
            if r.reaction_type not in grouped:
                grouped[r.reaction_type] = {
                    'count': 0,
                    'users': []
                }
            grouped[r.reaction_type]['count'] += 1
            
            # Get username for display
            user = User.query.get(r.user_id)
            username = user.email.split('@')[0] if user and user.email else f"User{r.user_id}"
            grouped[r.reaction_type]['users'].append({
                'user_id': r.user_id,
                'username': username
            })
            
            if r.user_id == user_id:
                user_reactions.append(r.reaction_type)
        
        return jsonify({
            'success': True,
            'reactions': grouped,
            'user_reactions': user_reactions
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching reactions: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch reactions'}), 500
