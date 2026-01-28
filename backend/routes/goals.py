from flask import Blueprint, request, jsonify, g
from db import get_db, return_db
from routes.auth import login_required
from utils.logging import log_activity
import datetime
from  datetime import date, time

goals_bp = Blueprint('goals_bp', __name__)

@goals_bp.route('/goals', methods=['POST'])
@login_required
def add_goal():
    user_id = g.user['id']
    data = request.get_json()

    name = data.get("name")
    goal_type = data.get("goal_type")
    target = data.get("target")
    progress = data.get("progress", 0)
    deadline = data.get("deadline")

    if not all([name, goal_type, target]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO goals (user_id, name, type, target, progress, deadline)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (user_id, name, goal_type, target, progress, deadline))
        goal_id = cursor.fetchone()[0]
        conn.commit()
        log_activity(user_id, "created", "goal", goal_id)
        return jsonify({"success": True, "goal_id": goal_id, "message": "Goal added successfully"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@goals_bp.route('/goals', methods=['GET'])
@login_required
def get_goals():
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM goals WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
        goals = cursor.fetchall()
        
        goals_list = [{
            "id": g_[0],
            "user_id": g_[1],
            "name": g_[2],
            "type": g_[3],
            "target": g_[4],
            "progress": g_[5],
            "deadline": g_[6].isoformat() if isinstance(g_[6], date) else str(g_[6]),
            "created_at": g_[7],
            "updated_at": g_[8]
        } for g_ in goals]
        
        return jsonify({"success": True, "goals": goals_list}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@goals_bp.route('/goals/<int:goal_id>', methods=['GET'])
@login_required
def get_goal(goal_id):
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM goals WHERE id = %s AND user_id = %s", (goal_id, user_id))
        goal = cursor.fetchone()
        if not goal:
            return jsonify({"success": False, "message": "Goal not found"}), 404

        goal_dict = {
            "id": goal[0],
            "user_id": goal[1],
            "name": goal[2],
            "type": goal[3],
            "target": goal[4],
            "progress": goal[5],
            "deadline": goal[6],
            "created_at": goal[7],
            "updated_at": goal[8]
        }
        return jsonify({"success": True, "goal": goal_dict}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@goals_bp.route('/goals/<int:goal_id>', methods=['PUT'])
@login_required
def update_goal(goal_id):
    user_id = g.user['id']
    data = request.get_json()

    name = data.get("name")
    goal_type = data.get("goal_type")
    target = data.get("target")
    progress = data.get("progress")
    deadline = data.get("deadline")

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT name, type, target, progress, deadline 
            FROM goals 
            WHERE id = %s AND user_id = %s
        """, (goal_id, user_id))
        existing = cursor.fetchone()

        if not existing:
            return jsonify({"success": False, "message": "Goal not found"}), 404

        new_name = name if name is not None else existing[0]
        new_type = goal_type if goal_type is not None else existing[1]
        new_target = target if target is not None else existing[2]
        new_progress = progress if progress is not None else existing[3]
        new_deadline = deadline if deadline is not None else existing[4]

        cursor.execute("""
            UPDATE goals 
            SET name = %s, type = %s, target = %s, progress = %s, deadline = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND user_id = %s
        """, (new_name, new_type, new_target, new_progress, new_deadline, goal_id, user_id))
        conn.commit()
        log_activity(user_id, "updated", "goal", goal_id)
        return jsonify({"success": True, "message": "Goal updated successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@goals_bp.route('/goals/<int:goal_id>', methods=['DELETE'])
@login_required
def delete_goal(goal_id):
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM goals WHERE id = %s AND user_id = %s", (goal_id, user_id))
        conn.commit()
        log_activity(user_id, "deleted", "goal", goal_id)
        return jsonify({"success": True, "message": "Goal deleted successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)