from flask import Blueprint, request, jsonify, g
from db import get_db, return_db
from routes.auth import login_required

weight_bp = Blueprint('weight_bp', __name__)

@weight_bp.route('/weight_logs', methods=['POST'])
@login_required
def add_weight():
    user_id = g.user['id']
    data = request.get_json()
    weight = data.get("weight_kg")
    date = data.get("date")
    
    if weight is None:
        return jsonify({"error": "Missing weight"}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO weight_logs (user_id, weight_kg, date)
            VALUES (%s, %s, %s)
            RETURNING id
        """, (user_id, weight, date))
        weight_id = cursor.fetchone()[0]
        conn.commit()
        return jsonify({"success": True, "weight_id": weight_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@weight_bp.route('/weight_logs', methods=['GET'])
@login_required
def get_weight_logs():
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id, weight_kg, date, created_at
            FROM weight_logs
            WHERE user_id = %s
            ORDER BY date DESC
        """, (user_id,))
        logs = cursor.fetchall()
        result = [{"id": w[0], "weight_kg": float(w[1]), "date": str(w[2]), "created_at": str(w[3])} for w in logs]
        return jsonify({"success": True, "weight_logs": result}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@weight_bp.route('/weight_logs/<int:log_id>', methods=['PUT'])
@login_required
def update_weight_log(log_id):
    user_id = g.user['id']
    data = request.get_json()
    new_weight = data.get("weight_kg")
    new_date = data.get("date")
    
    if new_weight is None:
        return jsonify({"error": "Missing weight"}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE weight_logs
            SET weight_kg = %s, date = %s
            WHERE id = %s AND user_id = %s
        """, (new_weight, new_date, log_id, user_id))
        conn.commit()
        return jsonify({"success": True, "message": "Weight log updated"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@weight_bp.route('/weight_logs/<int:log_id>', methods=['DELETE'])
@login_required
def delete_weight_log(log_id):
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM weight_logs WHERE id = %s AND user_id = %s", (log_id, user_id))
        conn.commit()
        return jsonify({"success": True, "message": "Weight log deleted"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)