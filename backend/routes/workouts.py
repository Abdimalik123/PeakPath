from flask import Flask, Blueprint, request, jsonify, g
from db import conn
from routes.auth import login_required

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

    cursor = conn.cursor()
    try:
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
        return jsonify({
            "success": True,
            "message": "Workout and exercises logged successfully",
            "workout_id": workout_id,
            "exercise_count": len(exercises)
            }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()

@workouts_bp.route('/workouts', methods=['GET'])
@login_required
def get_workouts():
    user_id = g.user['id']
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT w.id, w.date, w.type, w.duration, w.notes, COUNT(we.id) as exercise_count, w.created_at FROM workouts w LEFT JOIN workout_exercises we ON we.workout_id = w.id WHERE w.user_id = %s GROUP BY w.id ORDER BY w.date DESC", (user_id,))
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
        return jsonify({"success": True, "workouts": workout_list}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500 

@workouts_bp.route('/workouts/<int:workout_id>', methods=['GET'])
@login_required
def get_workout(workout_id):
    user_id = g.user['id']
    cursor = conn.cursor()
    try:
        cursor.execute("""
        SELECT 
        w.id AS workout_id, w.type AS workout_type, w.duration, w.date AS workout_date, w.notes AS workout_notes, e.id,e.id AS exercise_id,e.name AS exercise_name,
        e.category AS exercise_category,
        e.muscle_group,
        we.sets,
        we.reps,
        we.weight,
        we.notes AS exercise_notes
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
            if row[5] is not None:
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
        cursor = conn.cursor()

        # Fetch existing workout
        cursor.execute("""
            SELECT type, duration, date, notes 
            FROM workouts 
            WHERE id = %s AND user_id = %s
        """, (workout_id, user_id))
        existing = cursor.fetchone()
        if not existing:
            return jsonify({"success": False, "message": "Workout not found!"}), 404

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
                continue  # or raise an error

            sets = ex.get("sets")
            reps = ex.get("reps")
            weight = ex.get("weight")
            duration = ex.get("duration")
            notes = ex.get("notes")

            cursor.execute("""
                UPDATE workout_exercises
                SET sets = COALESCE(%s, sets),
                    reps = COALESCE(%s, reps),
                    weight = COALESCE(%s, weight),
                    duration = COALESCE(%s, duration),
                    notes = COALESCE(%s, notes)
                WHERE workout_id = %s AND exercise_id = %s
            """, (sets, reps, weight, duration, notes, workout_id, exercise_id))

        conn.commit()
        return jsonify({"success": True, "message": "Workout updated successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()


@workouts_bp.route('/workouts/<int:workout_id>', methods=['DELETE'])
@login_required
def delete_workout(workout_id):
    user_id = g.user['id']
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM workouts WHERE id = %s AND user_id = %s", (workout_id, user_id))
        cursor.execute("DELETE FROM workout_exercises WHERE workout_id = %s", (workout_id,))
        conn.commit()
        return jsonify({"success": True, "message": "Workout deleted successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()