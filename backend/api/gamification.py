from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models import UserPoint, UserAchievement
from api.auth import login_required
from utils.gamification_helper import get_user_stats, ACHIEVEMENT_DEFINITIONS
from utils.achievement_progress import get_achievement_progress, get_achievement_target

gamification_bp = Blueprint('gamification_bp', __name__)


@gamification_bp.route('/gamification/stats', methods=['GET'])
@login_required
def get_stats():
    """Get full gamification stats: points, level, achievements, recent activity."""
    user_id = g.user['id']

    try:
        stats = get_user_stats(user_id)
        return jsonify({"success": True, **stats}), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching gamification stats: {e}")
        return jsonify({"success": False, "message": "Failed to fetch stats"}), 500


@gamification_bp.route('/gamification/achievements', methods=['GET'])
@login_required
def get_achievements():
    """Get all achievements with earned status and progress for the user."""
    user_id = g.user['id']

    try:
        from models.user_achievement import UserAchievement

        earned = UserAchievement.query.filter_by(user_id=user_id).all()
        earned_keys = {a.achievement_type for a in earned}
        earned_map = {a.achievement_type: a for a in earned}
        
        # Get progress toward all achievements
        progress_data = get_achievement_progress(user_id)

        # Auto-grant any achievements where progress has reached the target
        # but the achievement was never recorded (catches historical gaps)
        from utils.gamification_helper import _grant_achievement
        newly_granted = False
        for key in ACHIEVEMENT_DEFINITIONS:
            if key not in earned_keys:
                target = get_achievement_target(key)
                if progress_data.get(key, 0) >= target:
                    achievement = _grant_achievement(user_id, key)
                    if achievement:
                        earned_keys.add(key)
                        earned_map[key] = achievement
                        newly_granted = True
        if newly_granted:
            db.session.commit()

        all_achievements = []
        for key, definition in ACHIEVEMENT_DEFINITIONS.items():
            is_earned = key in earned_keys
            current_progress = progress_data.get(key, 0)
            target = get_achievement_target(key)
            
            entry = {
                "key": key,
                "name": definition["name"],
                "description": definition["description"],
                "type": definition["type"],
                "earned": is_earned,
                "progress": current_progress,
                "target": target,
                "progress_percentage": int((current_progress / target) * 100) if target > 0 else 0
            }
            if key in earned_map and hasattr(earned_map[key], 'earned_at') and earned_map[key].earned_at:
                entry["earned_at"] = earned_map[key].earned_at.isoformat()
            all_achievements.append(entry)

        return jsonify({
            "success": True,
            "achievements": all_achievements,
            "earned_count": len(earned_keys),
            "total_count": len(ACHIEVEMENT_DEFINITIONS),
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching achievements: {e}")
        return jsonify({"success": False, "message": "Failed to fetch achievements"}), 500


@gamification_bp.route('/gamification/points', methods=['GET'])
@login_required
def get_points():
    """Get user's current points and level."""
    user_id = g.user['id']

    try:
        from utils.gamification_helper import _get_or_create_user_points

        user_points = _get_or_create_user_points(user_id)
        db.session.commit()

        return jsonify({
            "success": True,
            "total_points": user_points.total_points,
            "level": user_points.level,
            "points_to_next_level": user_points.points_to_next_level,
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching points: {e}")
        return jsonify({"success": False, "message": "Failed to fetch points"}), 500


@gamification_bp.route('/gamification/history', methods=['GET'])
@login_required
def get_point_history():
    """Get recent point transactions."""
    user_id = g.user['id']

    try:
        from models.point_transaction import PointTransaction

        transactions = PointTransaction.query.filter_by(user_id=user_id)\
            .order_by(PointTransaction.created_at.desc()).limit(50).all()

        result = [
            {
                "id": t.id,
                "points": t.points,
                "reason": t.reason,
                "entity_type": t.entity_type,
                "entity_id": t.entity_id,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in transactions
        ]

        return jsonify({"success": True, "transactions": result}), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching point history: {e}")
        return jsonify({"success": False, "message": "Failed to fetch history"}), 500
