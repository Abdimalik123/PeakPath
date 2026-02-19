from flask import Blueprint, jsonify, g, current_app
from database import db
from models import ActivityLog
from api.auth import login_required
from utils.logging import log_activity

activity_bp = Blueprint('activity_bp', __name__)


@activity_bp.route('/activity_logs', methods=['GET'])
@login_required
def get_activity_logs():
    user_id = g.user['id']
    
    try:
        logs = ActivityLog.query.filter_by(
            user_id=user_id
        ).order_by(
            ActivityLog.created_at.desc()
        ).all()
        
        result = [
            {
                "id": log.id,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "created_at": str(log.created_at)
            }
            for log in logs
        ]
        
        return jsonify({"success": True, "activity_logs": result}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching activity logs: {e}")
        return jsonify({"success": False, "message": str(e)}), 500