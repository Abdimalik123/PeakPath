from flask import Blueprint, request, jsonify, g, current_app
from db import get_db, return_db
from routes.auth import login_required
from utils.logging import log_activity
from utils.pagination import (
    get_pagination_params, 
    create_pagination_response,
    get_date_range_params,
    get_search_params,
    paginate_query
)


workouts_bp = Blueprint('workouts_bp', __name__)

@workouts_bp.route('/workouts', methods=['POST'])
@login_required
def add_workout():
    user_id = g.user['id']
    data = request.get_json()
    workout_type = data.get("type")
    duration = data.get("duration")
    date = data.get("date")
    notes = data.get("notes")
    exercises = data.get("exercises", [])

    if not workout_type or duration is None:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = get_db()
        cursor = conn.cursor()
        # Insert workout and get ID
        cursor.execute("""
            INSERT INTO workouts (user_id, type, duration, date, notes)
            VALUES (%s, %s, %s, %s, %s) RETURNING id
        """, (user_id, workout_type, duration, date, notes))
        workout_id = cursor.fetchone()[0]

        # Loop through exercises
        for ex in exercises:
            exercise_id = ex.get("exercise_id")

            # If no ID, create the exercise first
            if not exercise_id:
                cursor.execute("""
                    INSERT INTO exercises (user_id, name, muscle_group, equipment, description)
                    VALUES (%s, %s, %s, %s, %s) RETURNING id
                """, (
                    user_id,
                    ex.get("name"),
                    ex.get("muscle_group"),
                    ex.get("equipment"),
                    ex.get("description")
                ))
                exercise_id = cursor.fetchone()[0]
                log_activity(user_id, "created", "exercise", exercise_id)

            # Link exercise to workout
            cursor.execute("""
                INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, weight, duration, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                workout_id,
                exercise_id,
                ex.get("sets"),
                ex.get("reps"),
                ex.get("weight"),
                ex.get("duration"),
                ex.get("notes")
            ))

        conn.commit()
        # Log the workout creation
        log_activity(user_id, "created", "workout", workout_id)
        current_app.logger.info(f'User {user_id} created workout {workout_id} - Type: {workout_type}, Duration: {duration}min')
        
        # Award points and sync goals
        try:
            from utils.gamification_helper import award_points_for_action
            from utils.goal_sync import sync_goal_progress
            award_points_for_action(user_id, "workout_completed", "workout", workout_id)
            sync_goal_progress(user_id, "workout", workout_id, workout_type)
        except Exception as e:
            current_app.logger.error(f'Gamification error for user {user_id}: {str(e)}')
        
        return jsonify({
            "success": True,
            "message": "Workout and exercises logged successfully",
            "workout_id": workout_id,
            "exercise_count": len(exercises)
        }), 201

    except Exception as e:
        conn.rollback()
        current_app.logger.error(f'Error creating workout for user {user_id}: {str(e)}')
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@workouts_bp.route('/workouts', methods=['GET'])
@login_required
def get_workouts():
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Get pagination parameters
        pagination = get_pagination_params()
        page = pagination['page']
        per_page = pagination['per_page']
        
        # Get search and filter parameters
        search_params = get_search_params()
        date_range = get_date_range_params()
        
        # Build WHERE clause
        where_conditions = ["w.user_id = %s"]
        params = [user_id]
        
        # Add type filter
        if search_params['type']:
            where_conditions.append("w.type ILIKE %s")
            params.append(f"%{search_params['type']}%")
        
        # Add search filter (searches in notes)
        if search_params['search']:
            where_conditions.append("w.notes ILIKE %s")
            params.append(f"%{search_params['search']}%")
        
        # Add date range filter
        if date_range:
            if date_range.get('start_date'):
                where_conditions.append("w.date >= %s")
                params.append(date_range['start_date'])
            if date_range.get('end_date'):
                where_conditions.append("w.date <= %s")
                params.append(date_range['end_date'])
        
        where_clause = " AND ".join(where_conditions)
        
        # Get total count
        count_query = f"""
            SELECT COUNT(DISTINCT w.id)
            FROM workouts w
            WHERE {where_clause}
        """
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()[0]
        
        # Get paginated results
        base_query = f"""
            SELECT w.id, w.date, w.type, w.duration, w.notes, COUNT(we.id) as exercise_count, w.created_at
            FROM workouts w
            LEFT JOIN workout_exercises we ON we.workout_id = w.id
            WHERE {where_clause}
            GROUP BY w.id
            ORDER BY w.date DESC
        """
        
        paginated_query, limit, offset = paginate_query(base_query, page, per_page)
        cursor.execute(paginated_query, params + [limit, offset])
        workouts = cursor.fetchall()
        
        workout_list = []
        for workout in workouts:
            workout_dict = {
                "id": workout[0],
                "date": workout[1],
                "type": workout[2],
                "duration": workout[3],
                "notes": workout[4],
                "exercise_count": workout[5],
                "created_at": workout[6]
            }
            workout_list.append(workout_dict)
        
        return jsonify(create_pagination_response(workout_list, total_count, page, per_page)), 200
    except Exception as e:
        current_app.logger.error(f'Error fetching workouts for user {user_id}: {str(e)}')
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@workouts_bp.route('/workouts/<int:workout_id>', methods=['GET'])
@login_required
def get_workout(workout_id):
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 
                w.id AS workout_id, w.type AS workout_type, w.duration, w.date AS workout_date, w.notes AS workout_notes, 
                e.id AS exercise_id, e.name AS exercise_name, e.category AS exercise_category, e.muscle_group,
                we.sets, we.reps, we.weight, we.notes AS exercise_notes
            FROM workouts w
            JOIN workout_exercises we ON we.workout_id = w.id
            JOIN exercises e ON e.id = we.exercise_id
            WHERE w.id = %s AND w.user_id = %s;
        """, (workout_id, user_id))
        workout_data = cursor.fetchall()
        if not workout_data:
            return jsonify({"success": False, "message": "Workout not found"}), 404

        workout_info = {
            "id": workout_data[0][0],
            "type": workout_data[0][1],
            "duration": workout_data[0][2],
            "date": workout_data[0][3],
            "notes": workout_data[0][4],
            "exercises": []
        }
        for row in workout_data:
            workout_info["exercises"].append({
                "id": row[5],
                "name": row[6],
                "category": row[7],
                "muscle_group": row[8],
                "sets": row[9],
                "reps": row[10],
                "weight": row[11],
                "notes": row[12]
            })

        return jsonify({"success": True, "workout": workout_info}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@workouts_bp.route('/exercises', methods=['GET'])
@login_required
def get_exercises():
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id, name, category, muscle_group, equipment, description 
            FROM exercises 
            WHERE user_id = %s
            ORDER BY name
        """, (user_id,))
        exercises = [
            {"id": row[0], "name": row[1], "category": row[2], "muscle_group": row[3],
             "equipment": row[4], "description": row[5]}
            for row in cursor.fetchall()
        ]
        return jsonify({"success": True, "exercises": exercises})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)
@workouts_bp.route('/workouts/<int:workout_id>', methods=['PUT'])
@login_required
def update_workout(workout_id):
    user_id = g.user['id']
    data = request.get_json()
    notes = data.get("notes")
    workout_type = data.get("type")
    duration = data.get("duration")
    date = data.get("date")
    exercises = data.get("exercises", [])

    try:
        conn = get_db()
        cursor = conn.cursor()
        # Fetch existing workout
        cursor.execute("""
            SELECT type, duration, date, notes 
            FROM workouts 
            WHERE id = %s AND user_id = %s
        """, (workout_id, user_id))
        existing = cursor.fetchone()
        if not existing:
            return jsonify({"success": False, "message": "Workout not found"}), 404

        # Use fallback values
        new_type = workout_type if workout_type is not None else existing[0]
        new_duration = duration if duration is not None else existing[1]
        new_date = date if date is not None else existing[2]
        new_notes = notes if notes is not None else existing[3]

        # Update workout
        cursor.execute("""
            UPDATE workouts 
            SET type = %s, duration = %s, date = %s, notes = %s 
            WHERE id = %s AND user_id = %s
        """, (new_type, new_duration, new_date, new_notes, workout_id, user_id))

        # Update exercises
        for ex in exercises:
            exercise_id = ex.get("exercise_id")
            if not exercise_id:
                continue

            sets = ex.get("sets")
            reps = ex.get("reps")
            weight = ex.get("weight")
            duration_ex = ex.get("duration")
            notes_ex = ex.get("notes")

            cursor.execute("""
                UPDATE workout_exercises
                SET sets = COALESCE(%s, sets),
                    reps = COALESCE(%s, reps),
                    weight = COALESCE(%s, weight),
                    duration = COALESCE(%s, duration),
                    notes = COALESCE(%s, notes)
                WHERE workout_id = %s AND exercise_id = %s
            """, (sets, reps, weight, duration_ex, notes_ex, workout_id, exercise_id))

        conn.commit()
        log_activity(user_id, "updated", "workout", workout_id)
        return jsonify({"success": True, "message": "Workout updated successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@workouts_bp.route('/workouts/<int:workout_id>', methods=['DELETE'])
@login_required
def delete_workout(workout_id):
    user_id = g.user['id']
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM workouts WHERE id = %s AND user_id = %s", (workout_id, user_id))
        conn.commit()
        log_activity(user_id, "deleted", "workout", workout_id)
        return jsonify({"success": True, "message": "Workout deleted successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@workouts_bp.route('/workouts/stats', methods=['GET'])
@login_required
def get_workout_stats():
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