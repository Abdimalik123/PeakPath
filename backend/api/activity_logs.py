from flask import Blueprint, jsonify, g
from db import get_db, return_db
from routes.auth import login_required
from utils.logging import log_activity

activity_bp = Blueprint('activity_bp', __name__)

@activity_bp.route('/activity_logs', methods=['GET'])
@login_required
def get_activity_logs():
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id, action, entity_type, entity_id, created_at
            FROM activity_logs
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))
        logs = cursor.fetchall()
        result = [
            {
                "id": a[0],
                "action": a[1],
                "entity_type": a[2],
                "entity_id": a[3],
                "created_at": str(a[4])
            }
            for a in logs
        ]
        return jsonify({"success": True, "activity_logs": result}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)