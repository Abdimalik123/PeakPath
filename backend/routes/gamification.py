from flask import Blueprint, request, jsonify, g
from db import get_db, return_db
from routes.auth import login_required
from utils.logging import log_activity

gamification_bp = Blueprint('gamification_bp', __name__)


@gamification_bp.route('/gamification/points', methods=['GET'])
@login_required
def get_user_points():
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 
                COUNT(*) as total_workouts,
                SUM(duration) as total_duration,
                COUNT(DISTINCT type) as total_types,
                COUNT(DISTINCT date) as total_dates
            FROM workouts
            WHERE user_id = %s
        """, (user_id,))
        stats = cursor.fetchone()
        return jsonify({"success": True, "stats": stats}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)

@gamification_bp.route('/gamification', methods=['POST'])
@login_required
def update_user_points():
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE users
            SET points = points + 1
            WHERE id = %s
        """, (user_id,))
        conn.commit()
        return jsonify({"success": True, "message": "Points updated successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)

@gamification_bp.route('/gamification', methods=['PUT'])
@login_required
def reset_user_points():
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE users
            SET points = 0
            WHERE id = %s
        """, (user_id,))
        conn.commit()
        return jsonify({"success": True, "message": "Points reset successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)

@gamification_bp.route('/gamification', methods=['DELETE'])
@login_required
def delete_user_points():
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            DELETE FROM users
            WHERE id = %s
        """, (user_id,))
        conn.commit()
        return jsonify({"success": True, "message": "Points deleted successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)

@gamification_bp.route('/gamification/achievements', methods=['GET'])
@login_required
def get_achievements():
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT * FROM achievements
            WHERE user_id = %s
        """, (user_id,))
        achievements = cursor.fetchall()
        return jsonify({"success": True, "achievements": achievements}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)

@gamification_bp.route('/gamification', methods=['GET'])
@login_required
def check_achievements():
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT * FROM achievements
            WHERE user_id = %s
        """, (user_id,))
        achievements = cursor.fetchall()
        return jsonify({"success": True, "achievements": achievements}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)

