from flask import Flask, Blueprint, request, jsonify, g
from db import conn
from routes.auth import login_required

goals_bp = Blueprint('goals_bp', __name__)


@goals_bp.route('/goals', methods = ['POST'])
@login_required
def add_goals():
    user_id = g.user['id']
    data = request.get_json()

    name = data.get("name")
    goal_type = data.get("goal_type")
    target = data.get("target")
    progress = data.get("progress")
    deadline = data.get("deadline")

    if not all([name, goal_type, target, progress,deadline]):
        return jsonify({"error": "Missing required fields"})
    
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO goals (name, type, target, progress, deadline) VALUES (%s, %s, %s, %s, %s)", (name, goal_type, target, progress, deadline))
        conn.commit()
        return jsonify({"success": True, "message": "Goal added successfully"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}) 
    finally:
        cursor.close()

@goals_bp.route('/goals', methods = ['GET'])
@login_required
def get_goals():
    user_id = g.user['id']

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM goals WHERE user_id = %s", (user_id,))
        goals = cursor.fetchall()
        goals_list = []
        for goal in goals:
            goal_dict = {
                "id": goal[0],
                "name": goal[2],
                "type": goal[3],
                "target": goal[4],
                "progress": goal[5],
                "deadline": goal[6],
                "created_at": goal[7],
                "updated_at": goal[8]
            }
            goals_list.append(goal_dict)
        return jsonify({"success": True, "goals": goals_list}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()



@goals_bp.route('/goals/<int:goal_id>', methods = ['PUT'])
@login_required 
def update_goal(goal_id):
    user_id = g.user['id']
    data = request.get_json()

    name = data.get("name")
    goal_type = data.get("goal_type")
    target = data.get("target")
    progress = data.get("progress")
    deadline = data.get("deadline")

    try:
        cursor = conn.cursor()

        # Fetch existing goal
        cursor.execute("SELECT name, type, target, progress, deadline FROM goals WHERE id = %s AND user_id = %s", (goal_id, user_id))
        existing = cursor.fetchone()

        if not existing:
            return jsonify({"success": False, "message": "Goal not found"}), 404
        new_name = name if name is not None else existing[0]
        new_type = goal_type if goal_type is not None else existing[1]
        new_target = target if target is not None else existing[2]
        new_progress = progress if progress is not None else existing[3]
        new_deadline = deadline if deadline is not None else existing[4]

        # Update goal
        cursor.execute("UPDATE goal SET name = %s, type = %s, target = %s, progress = %s, deadline = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s AND user_id = %s", (new_name, new_type, new_target, new_progress, new_deadline, goal_id, user_id))
        conn.commit()
        return jsonify({"success": True, "message": "Goal updated successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()









@goals_bp.route('/goals/<int:goal_id>', methods = ['DELETE'])
@login_required
def delete_goal(goal_id):
    user_id = g.user['id']

    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM goals WHERE id = %s AND user_id = %s",(goal_id, user_id))
        conn.commit()
        return jsonify({"success":True, "message":"Goal deleted successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
    
