from flask import Blueprint, request, jsonify, g, current_app
from db import get_db, return_db
from routes.auth import login_required
from utils.logging import log_activity
from utils.pagination import (
    get_pagination_params,
    create_pagination_response,
    get_search_params
)

habits_bp = Blueprint('habits_bp', __name__)

@habits_bp.route('/habits', methods=['POST'])
@login_required
def add_habit():
    user_id = g.user['id']
    data = request.get_json()
    name = data.get("name")
    frequency = data.get("frequency")
    reminder_time = data.get("reminder_time")
    description = data.get("description")
    next_occurrence = data.get("next_occurrence")

    if not all([name, frequency, reminder_time, description, next_occurrence]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO habits (user_id, name, frequency, reminder_time, description, next_occurrence)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
        """, (user_id, name, frequency, reminder_time, description, next_occurrence))
        habit_id = cursor.fetchone()[0]
        conn.commit()
        log_activity(user_id, "created", "habit", habit_id)
        return jsonify({"success": True, "message": "Habit added successfully", "habit_id": habit_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@habits_bp.route('/habits', methods=['GET'])
@login_required
def get_habits():
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
        
        # Add frequency filter
        if search_params['type']:  # Using 'type' param for frequency
            where_conditions.append("frequency = %s")
            params.append(search_params['type'])
        
        # Add search filter (searches in name and description)
        if search_params['search']:
            where_conditions.append("(name ILIKE %s OR description ILIKE %s)")
            params.extend([f"%{search_params['search']}%", f"%{search_params['search']}%"])
        
        where_clause = " AND ".join(where_conditions)
        
        # Get total count
        count_query = f"SELECT COUNT(*) FROM habits WHERE {where_clause}"
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()[0]
        
        # Get paginated results
        offset = (page - 1) * per_page
        query = f"""
            SELECT * FROM habits 
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, params + [per_page, offset])
        habits = cursor.fetchall()
        
        habits_list = []
        for habit in habits:
            habits_list.append({
                "id": habit[0],
                "name": habit[2],
                "frequency": habit[3],
                "reminder_time": habit[4],
                "description": habit[5],
                "next_occurrence": habit[6],
                "created_at": habit[7],
                "updated_at": habit[8]
            })
        
        return jsonify(create_pagination_response(habits_list, total_count, page, per_page)), 200
    except Exception as e:
        current_app.logger.error(f'Error fetching habits for user {user_id}: {str(e)}')
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@habits_bp.route('/habits/<int:habit_id>', methods=['GET'])
@login_required
def get_habit(habit_id):
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM habits WHERE id = %s AND user_id = %s", (habit_id, user_id))
        habit = cursor.fetchone()
        if not habit:
            return jsonify({"success": False, "message": "Habit not found"}), 404
        habit_info = {
            "id": habit[0],
            "name": habit[2],
            "frequency": habit[3],
            "reminder_time": habit[4],
            "description": habit[5],
            "next_occurence": habit[6],
            "created_at": habit[7],
            "updated_at": habit[8]
        }
        return jsonify({"success": True, "habit": habit_info}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@habits_bp.route('/habits/<int:habit_id>', methods=['PUT'])
@login_required
def update_habit(habit_id):
    user_id = g.user['id']
    data = request.get_json()
    name = data.get("name")
    frequency = data.get("frequency")
    reminder_time = data.get("reminder_time")
    description = data.get("description")
    next_occurence = data.get("next_occurence")

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT name, frequency, reminder_time, description, next_occurence
            FROM habits WHERE id = %s AND user_id = %s
        """, (habit_id, user_id))
        existing = cursor.fetchone()
        if not existing:
            return jsonify({"success": False, "message": "Habit not found"}), 404

        new_name = name if name is not None else existing[0]
        new_frequency = frequency if frequency is not None else existing[1]
        new_reminder_time = reminder_time if reminder_time is not None else existing[2]
        new_description = description if description is not None else existing[3]
        new_next_occurence = next_occurence if next_occurence is not None else existing[4]

        cursor.execute("""
            UPDATE habits
            SET name=%s, frequency=%s, reminder_time=%s, description=%s, next_occurence=%s
            WHERE id=%s AND user_id=%s
        """, (new_name, new_frequency, new_reminder_time, new_description, new_next_occurence, habit_id, user_id))
        conn.commit()
        log_activity(user_id, "updated", "habit", habit_id)
        return jsonify({"success": True, "message": "Habit updated successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@habits_bp.route('/habits/<int:habit_id>/log', methods=['POST'])
@login_required
def log_habit(habit_id):
    user_id = g.user['id']
    data = request.get_json()
    completed = data.get("completed", True)
    timestamp = data.get("timestamp")
    amount = data.get("amount")
    notes = data.get("notes")

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM habits WHERE id = %s AND user_id = %s", (habit_id, user_id))
        if not cursor.fetchone():
            return jsonify({"error": "Habit not found"}), 404

        cursor.execute("""
            INSERT INTO habit_logs (habit_id, timestamp, completed, amount, notes)
            VALUES (%s, COALESCE(%s, CURRENT_TIMESTAMP), %s, %s, %s)
        """, (habit_id, timestamp, completed, amount, notes))
        conn.commit()
        current_app.logger.info(f'User {user_id} logged habit {habit_id} - Completed: {completed}')
        
        # Award points and sync goals
        try:
            from utils.gamification_helper import award_points_for_action
            from utils.goal_sync import sync_goal_progress
            if completed:
                award_points_for_action(user_id, "habit_logged", "habit", habit_id)
                sync_goal_progress(user_id, "habit", habit_id)
        except Exception as e:
            current_app.logger.error(f'Gamification error for habit {habit_id}: {str(e)}')
        
        return jsonify({"success": True, "message": "Habit log created"}), 201
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f'Error logging habit {habit_id} for user {user_id}: {str(e)}')
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@habits_bp.route('/habits/<int:habit_id>/logs', methods=['GET'])
@login_required
def get_habit_logs(habit_id):
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT hl.id, hl.timestamp, hl.completed, hl.amount, hl.notes
            FROM habit_logs hl
            JOIN habits h ON hl.habit_id = h.id
            WHERE hl.habit_id = %s AND h.user_id = %s
            ORDER BY hl.timestamp DESC
        """, (habit_id, user_id))
        logs = cursor.fetchall()
        logs_list = []
        for log in logs:
            logs_list.append({
                "id": log[0],
                "timestamp": log[1],
                "completed": log[2],
                "amount": log[3],
                "notes": log[4]
            })
        return jsonify({"success": True, "logs": logs_list}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@habits_bp.route('/habits/<int:habit_id>', methods=['DELETE'])
@login_required
def delete_habit(habit_id):
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM habits WHERE id = %s AND user_id = %s", (habit_id, user_id))
        conn.commit()
        log_activity(user_id, "deleted", "habit", habit_id)
        return jsonify({"success": True, "message": "Habit deleted successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)