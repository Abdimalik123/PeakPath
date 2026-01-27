from flask import Blueprint, request, jsonify, g, current_app
from db import get_db, return_db
from routes.auth import login_required
from utils.logging import log_activity



workouts_bp = Blueprint('workouts_bp', __name__)

@workouts_bp.route('/workouts', methods=['POST'])
@login_required
def create_workout():
    user_id = g.user['id']
    data = request.get_json()
    workout_type = data.get("type")
    duration = data.get("duration")
    date = data.get("date")
    notes = data.get("notes")
  

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

        conn.commit()
        # Log the workout creation
        log_activity(user_id, "created", "workout", workout_id)

        return jsonify({
            "success": True,
            "message": "Workout logged successfully",
            "workout_id": workout_id,
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@workouts_bp.route('/workouts/<int:workout_id>/exercises', methods=['POST'])
@login_required
def add_exercise_to_workout(workout_id):
    user_id = g.user['id']
    data = request.get_json()

    exercise_id = data.get("exercise_id")
    sets = data.get("sets")
    reps = data.get("reps")
    weight = data.get("weight")
    duration = data.get("duration")
    notes = data.get("notes")

    if not exercise_id:
        return jsonify({"error": "Missing exercise_id"}), 400
    if duration is not None and duration < 0:
        return jsonify({"error": "Duration cannot be negative"}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    try:
        # Verify workout and exercise belong to user
        cursor.execute("SELECT 1 FROM workouts WHERE id = %s AND user_id = %s", (workout_id, user_id))
        if cursor.fetchone() is None:
            return jsonify({"error": "Workout not found or inaccessible"}), 404
        
        # Verify exercise exists
        cursor.execute("SELECT 1 FROM exercises WHERE id = %s", (exercise_id,))
        if cursor.fetchone() is None:
            return jsonify({"error": "Exercise not found"}), 404

        # Insert into workout_exercises
        cursor.execute("""
            INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, weight, duration, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (workout_id, exercise_id, sets, reps, weight, duration, notes))
        conn.commit()

        log_activity(user_id, "added", "workout_exercise", exercise_id)
        return jsonify({"success": True, "message": "Exercise added to workout"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)
    

@workouts_bp.route('/workouts/<int:workout_id>/remove_exercise', methods=['POST'])
@login_required
def remove_exercise_from_workout(workout_id):
    user_id = g.user['id']
    data = request.json
    exercise_id = data.get('exercise_id')
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            DELETE FROM workout_exercises
            WHERE workout_id=%s AND exercise_id=%s
        """, (workout_id, exercise_id))
        conn.commit()
        log_activity(user_id, "exercise_removed_from_workout", "workout_exercise", exercise_id)
        return jsonify({"success": True, "message": "Exercise removed from workout"}), 200

    except Exception as e:
        conn.rollback()
        raise e
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
        cursor.execute("""
            SELECT id, date, type, duration, notes
            FROM workouts
            WHERE user_id = %s
            ORDER BY date DESC
        """, (user_id,))
        workouts = cursor.fetchall()

        result = [
            {"id": w[0], "date": str(w[1]), "type": w[2], "duration": w[3], "notes": w[4]}
            for w in workouts
        ]
        return jsonify({"success": True, "workouts": result}), 200

    except Exception as e:
        return jsonify({"success": False, "message": "Failed to retrieve workouts: " + str(e)}), 500
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