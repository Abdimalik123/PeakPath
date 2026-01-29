from flask import Blueprint, jsonify, g
from db import get_db, return_db
from api.auth import login_required

notifications_bp = Blueprint('notifications_bp', __name__)

@notifications_bp.route('/notifications', methods=['GET'])
@login_required
def get_notifications():
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id, type, message, is_read, priority, scheduled_for, delivered_at, read_at
            FROM notifications
            WHERE user_id = %s
            ORDER BY scheduled_for DESC NULLS LAST, created_at DESC
        """, (user_id,))
        notes = cursor.fetchall()
        result = [
            {
                "id": n[0],
                "type": n[1],
                "message": n[2],
                "is_read": n[3],
                "priority": n[4],
                "scheduled_for": str(n[5]) if n[5] else None,
                "delivered_at": str(n[6]) if n[6] else None,
                "read_at": str(n[7]) if n[7] else None
            }
            for n in notes
        ]
        return jsonify({"success": True, "notifications": result}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@notifications_bp.route('/notifications/<int:note_id>/read', methods=['PUT'])
@login_required
def mark_as_read(note_id):
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE notifications
            SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
            WHERE id = %s AND user_id = %s
        """, (note_id, user_id))
        conn.commit()
        return jsonify({"success": True, "message": "Notification marked as read"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)