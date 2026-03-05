from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models import UserAchievement
from api.auth import login_required
from utils.gamification_helper import ACHIEVEMENT_DEFINITIONS
from utils.achievement_progress import get_achievement_progress, get_achievement_target

achievement_discovery_bp = Blueprint('achievement_discovery_bp', __name__)


@achievement_discovery_bp.route('/achievements/discovery', methods=['GET'])
@login_required
def get_achievement_discovery():
    """Get achievements organized by category with locked/unlocked status and hints"""
    try:
        user_id = g.user['id']
        
        # Get user's earned achievements
        user_achievements = UserAchievement.query.filter_by(user_id=user_id).all()
        unlocked_ids = {ua.achievement_type for ua in user_achievements}
        
        # Get progress for all achievements
        progress_data = get_achievement_progress(user_id)
        
        # Categorize achievements
        categories = {
            'consistency': {'name': '🔥 Consistency', 'achievements': []},
            'strength': {'name': '💪 Strength', 'achievements': []},
            'volume': {'name': '📊 Volume', 'achievements': []},
            'social': {'name': '👥 Social', 'achievements': []},
            'exploration': {'name': '🎯 Exploration', 'achievements': []}
        }
        
        for ach_id, ach_def in ACHIEVEMENT_DEFINITIONS.items():
            is_unlocked = ach_id in unlocked_ids
            current_progress = progress_data.get(ach_id, 0)
            target = get_achievement_target(ach_id)
            progress_pct = int((current_progress / target) * 100) if target > 0 else 0
            
            # Determine rarity based on points
            points = ach_def.get('points', 0)
            if points >= 500:
                rarity = 'legendary'
            elif points >= 300:
                rarity = 'epic'
            elif points >= 150:
                rarity = 'rare'
            else:
                rarity = 'common'
            
            # Determine category
            category = 'exploration'
            ach_lower = ach_id.lower()
            if 'streak' in ach_lower or 'consistency' in ach_lower or 'daily' in ach_lower:
                category = 'consistency'
            elif 'strength' in ach_lower or 'pr' in ach_lower or 'lift' in ach_lower:
                category = 'strength'
            elif 'volume' in ach_lower or 'total' in ach_lower:
                category = 'volume'
            elif 'social' in ach_lower or 'friend' in ach_lower or 'like' in ach_lower:
                category = 'social'
            
            # Create hint for locked achievements
            hint = ""
            if not is_unlocked:
                if progress_pct > 0:
                    hint = f"{current_progress}/{target} - Keep going!"
                else:
                    hint = ach_def.get('description', 'Complete the challenge to unlock')
            
            achievement_data = {
                'id': ach_id,
                'name': ach_def['name'],
                'description': ach_def['description'],
                'points': points,
                'icon': ach_def.get('icon', '🏆'),
                'rarity': rarity,
                'is_unlocked': is_unlocked,
                'progress': current_progress,
                'target': target,
                'progress_percentage': progress_pct,
                'hint': hint
            }
            
            if category in categories:
                categories[category]['achievements'].append(achievement_data)
        
        # Calculate stats
        total_achievements = len(ACHIEVEMENT_DEFINITIONS)
        unlocked_count = len(unlocked_ids)
        total_points_earned = sum(
            ACHIEVEMENT_DEFINITIONS[ach_id].get('points', 0) 
            for ach_id in unlocked_ids 
            if ach_id in ACHIEVEMENT_DEFINITIONS
        )
        
        return jsonify({
            'success': True,
            'categories': categories,
            'stats': {
                'total_achievements': total_achievements,
                'unlocked_count': unlocked_count,
                'locked_count': total_achievements - unlocked_count,
                'completion_percentage': int((unlocked_count / total_achievements) * 100) if total_achievements > 0 else 0,
                'total_points_earned': total_points_earned
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching achievement discovery: {e}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': str(e)}), 500
