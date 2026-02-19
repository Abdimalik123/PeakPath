from flask import Blueprint, jsonify, g, current_app
from database import db
from models import Notification
from api.auth import login_required
from datetime import datetime

notifications_bp = Blueprint('notifications_bp', __name__)


@notifications_bp.route('/notifications', methods=['GET'])
@login_required
def get_notifications():
    user_id = g.user['id']

    try:
        notifications = Notification.query.filter_by(
            user_id=user_id
        ).order_by(
            Notification.scheduled_for.desc().nullslast(),
            Notification.id.desc()
        ).limit(50).all()

        result = [
            {
                "id": n.id,
                "type": n.type,
                "message": n.message,
                "is_read": n.is_read,
                "priority": n.priority,
                "scheduled_for": n.scheduled_for.isoformat() if n.scheduled_for else None,
                "delivered_at": n.delivered_at.isoformat() if n.delivered_at else None,
                "read_at": n.read_at.isoformat() if n.read_at else None,
            }
            for n in notifications
        ]

        return jsonify({"success": True, "notifications": result}), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching notifications: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@notifications_bp.route('/notifications/unread-count', methods=['GET'])
@login_required
def get_unread_count():
    user_id = g.user['id']

    try:
        count = Notification.query.filter_by(
            user_id=user_id,
            is_read=False,
        ).count()

        return jsonify({"success": True, "unread_count": count}), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching unread count: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@notifications_bp.route('/notifications/<int:note_id>/read', methods=['PUT'])
@login_required
def mark_as_read(note_id):
    user_id = g.user['id']

    try:
        notification = Notification.query.filter_by(
            id=note_id,
            user_id=user_id,
        ).first()

        if not notification:
            return jsonify({"success": False, "message": "Notification not found"}), 404

        notification.is_read = True
        notification.read_at = datetime.utcnow()
        db.session.commit()

        return jsonify({"success": True, "message": "Notification marked as read"}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error marking notification as read: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@notifications_bp.route('/notifications/read-all', methods=['PUT'])
@login_required
def mark_all_as_read():
    user_id = g.user['id']

    try:
        Notification.query.filter_by(
            user_id=user_id,
            is_read=False,
        ).update({"is_read": True, "read_at": datetime.utcnow()})
        db.session.commit()

        return jsonify({"success": True, "message": "All notifications marked as read"}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error marking all as read: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
