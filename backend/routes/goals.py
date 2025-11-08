from flask import Blueprint, request, jsonify, g, current_app
from db import get_db, return_db
from routes.auth import login_required
from utils.logging import log_activity
from utils.pagination import (
    get_pagination_params,
    create_pagination_response,
    get_search_params
)

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
        # After adding a goal
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
        # Get pagination parameters
        pagination = get_pagination_params()
        page = pagination['page']
        per_page = pagination['per_page']
        
        # Get search parameters
        search_params = get_search_params()
        
        # Build WHERE clause
        where_conditions = ["user_id = %s"]
        params = [user_id]
        
        # Add category filter (using 'type' field)
        if search_params['category']:
            where_conditions.append("type = %s")
            params.append(search_params['category'])
        
        # Add status filter (completed/active)
        if search_params['status']:
            if search_params['status'] == 'completed':
                where_conditions.append("progress >= target")
            elif search_params['status'] == 'active':
                where_conditions.append("progress < target")
        
        # Add search filter (searches in name)
        if search_params['search']:
            where_conditions.append("name ILIKE %s")
            params.append(f"%{search_params['search']}%")
        
        where_clause = " AND ".join(where_conditions)
        
        # Get total count
        count_query = f"SELECT COUNT(*) FROM goals WHERE {where_clause}"
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()[0]
        
        # Get paginated results
        offset = (page - 1) * per_page
        query = f"""
            SELECT * FROM goals 
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, params + [per_page, offset])
        goals = cursor.fetchall()
        
        goals_list = [{
            "id": g_[0],
            "user_id": g_[1],
            "name": g_[2],
            "type": g_[3],
            "target": g_[4],
            "progress": g_[5],
            "deadline": g_[6],
            "created_at": g_[7],
            "updated_at": g_[8]
        } for g_ in goals]
        
        return jsonify(create_pagination_response(goals_list, total_count, page, per_page)), 200
    except Exception as e:
        current_app.logger.error(f'Error fetching goals for user {user_id}: {str(e)}')
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
        # After updating a goal
        log_activity(user_id, "updated", "goal", goal_id)
        return jsonify({"success": True, "message": "Goal updated successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@goals_bp.route('/goals/<int:goal_id>/progress', methods=['PATCH'])
@login_required
def update_goal_progress(goal_id):
    user_id = g.user['id']
    data = request.get_json()
    progress = data.get("progress")

    if progress is None:
        return jsonify({"error": "Missing progress value"}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE goals 
            SET progress = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND user_id = %s
        """, (progress, goal_id, user_id))
        conn.commit()
        # Optionally log progress update
        log_activity(user_id, "updated", "goal_progress", goal_id)
        return jsonify({"success": True, "message": "Progress updated"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@goals_bp.route('/goals/completed', methods=['GET'])
@login_required
def get_completed_goals():
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT * FROM goals 
            WHERE user_id = %s AND progress >= target
        """, (user_id,))
        completed_goals = cursor.fetchall()
        goals_list = [{
            "id": g_[0],
            "name": g_[2],
            "type": g_[3],
            "target": g_[4],
            "progress": g_[5],
            "deadline": g_[6],
            "created_at": g_[7],
            "updated_at": g_[8]
        } for g_ in completed_goals]
        return jsonify({"success": True, "completed_goals": goals_list}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@goals_bp.route('/goals/active', methods=['GET'])
@login_required
def get_active_goals():
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT * FROM goals 
            WHERE user_id = %s AND (progress < target OR deadline >= CURRENT_DATE)
        """, (user_id,))
        active_goals = cursor.fetchall()
        goals_list = [{
            "id": g_[0],
            "name": g_[2],
            "type": g_[3],
            "target": g_[4],
            "progress": g_[5],
            "deadline": g_[6],
            "created_at": g_[7],
            "updated_at": g_[8]
        } for g_ in active_goals]
        return jsonify({"success": True, "active_goals": goals_list}), 200
    except Exception as e:
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
        # After deleting a goal
        log_activity(user_id, "deleted", "goal", goal_id)
        return jsonify({"success": True, "message": "Goal deleted successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@goals_bp.route('/goals/<int:goal_id>/link', methods=['POST'])
@login_required
def link_goal(goal_id):
    user_id = g.user['id']
    data = request.get_json()
    
    entity_type = data.get("entity_type")
    entity_id = data.get("entity_id")
    linked_workout_type = data.get("linked_workout_type")
    contribution = data.get("contribution", 1)
    
    if not entity_type or entity_type not in ['habit', 'workout']:
        return jsonify({"error": "Invalid entity_type"}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM goals WHERE id = %s AND user_id = %s", (goal_id, user_id))
        if not cursor.fetchone():
            return jsonify({"error": "Goal not found"}), 404
        
        cursor.execute("""
            INSERT INTO goal_links (goal_id, entity_type, entity_id, linked_workout_type, contribution_value)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (goal_id, entity_type, entity_id, linked_workout_type, contribution))
        link_id = cursor.fetchone()[0]
        
        cursor.execute("UPDATE goals SET auto_sync = TRUE WHERE id = %s", (goal_id,))
        conn.commit()
        
        return jsonify({"success": True, "link_id": link_id, "message": "Goal linked successfully"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@goals_bp.route('/goals/<int:goal_id>/links', methods=['GET'])
@login_required
def get_goal_links(goal_id):
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM goals WHERE id = %s AND user_id = %s", (goal_id, user_id))
        if not cursor.fetchone():
            return jsonify({"error": "Goal not found"}), 404
        
        from utils.goal_sync import get_linked_goals
        links = get_linked_goals(goal_id)
        return jsonify({"success": True, "links": links}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@goals_bp.route('/goals/<int:goal_id>/link/<int:link_id>', methods=['DELETE'])
@login_required
def unlink_goal(goal_id, link_id):
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM goals WHERE id = %s AND user_id = %s", (goal_id, user_id))
        if not cursor.fetchone():
            return jsonify({"error": "Goal not found"}), 404
        
        cursor.execute("DELETE FROM goal_links WHERE id = %s AND goal_id = %s", (link_id, goal_id))
        conn.commit()
        return jsonify({"success": True, "message": "Link removed"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@goals_bp.route('/goals/<int:goal_id>/sync', methods=['POST'])
@login_required
def sync_goal(goal_id):
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM goals WHERE id = %s AND user_id = %s", (goal_id, user_id))
        if not cursor.fetchone():
            return jsonify({"error": "Goal not found"}), 404
        
        from utils.goal_sync import calculate_goal_progress_from_scratch
        new_progress = calculate_goal_progress_from_scratch(goal_id, user_id)
        return jsonify({"success": True, "new_progress": new_progress}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)