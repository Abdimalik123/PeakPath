from flask import Blueprint, request, jsonify, g
from db import get_db, return_db
from routes.auth import login_required

template_exercises_bp = Blueprint('template_exercises_bp', __name__)

# Add exercise to a template
@template_exercises_bp.route('/template-exercises', methods=['POST'])
@login_required
def add_template_exercise():
    user_id = g.user['id']
    data = request.get_json()
    template_id = data.get("template_id")
    exercise_id = data.get("exercise_id")
    sets = data.get("sets")
    reps = data.get("reps")
    weight = data.get("weight")
    duration = data.get("duration")
    rest_time = data.get("rest_time")
    order_index = data.get("order_index")
    notes = data.get("notes")

    if not template_id or not exercise_id:
        return jsonify({"error": "Template ID and Exercise ID are required"}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO template_exercises
            (template_id, exercise_id, sets, reps, weight, duration, rest_time, order_index, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (template_id, exercise_id, sets, reps, weight, duration, rest_time, order_index, notes))
        ex_id = cursor.fetchone()[0]
        conn.commit()
        return jsonify({"success": True, "template_exercise_id": ex_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)

# Get all exercises in a template
@template_exercises_bp.route('/template-exercises/<int:template_id>', methods=['GET'])
@login_required
def get_template_exercises(template_id):
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT te.id, te.exercise_id, e.name, te.sets, te.reps, te.weight, te.duration, te.rest_time, te.order_index, te.notes
            FROM template_exercises te
            JOIN exercises e ON e.id = te.exercise_id
            JOIN workout_templates wt ON wt.id = te.template_id
            WHERE te.template_id = %s AND wt.user_id = %s
            ORDER BY te.order_index
        """, (template_id, user_id))
        exercises = cursor.fetchall()
        result = [{
            "id": row[0],
            "exercise_id": row[1],
            "name": row[2],
            "sets": row[3],
            "reps": row[4],
            "weight": row[5],
            "duration": row[6],
            "rest_time": row[7],
            "order_index": row[8],
            "notes": row[9]
        } for row in exercises]
        return jsonify({"success": True, "exercises": result}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)

# Update a template exercise
@template_exercises_bp.route('/template-exercises/<int:te_id>', methods=['PUT'])
@login_required
def update_template_exercise(te_id):
    user_id = g.user['id']
    data = request.get_json()
    sets = data.get("sets")
    reps = data.get("reps")
    weight = data.get("weight")
    duration = data.get("duration")
    rest_time = data.get("rest_time")
    order_index = data.get("order_index")
    notes = data.get("notes")

    conn = get_db()
    cursor = conn.cursor()
    try:
        # Optional: ensure the template belongs to the user
        cursor.execute("""
            UPDATE template_exercises te
            SET sets = COALESCE(%s, sets),
                reps = COALESCE(%s, reps),
                weight = COALESCE(%s, weight),
                duration = COALESCE(%s, duration),
                rest_time = COALESCE(%s, rest_time),
                order_index = COALESCE(%s, order_index),
                notes = COALESCE(%s, notes)
            FROM workout_templates wt
            WHERE te.id = %s AND te.template_id = wt.id AND wt.user_id = %s
        """, (sets, reps, weight, duration, rest_time, order_index, notes, te_id, user_id))
        conn.commit()
        return jsonify({"success": True, "message": "Template exercise updated"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)

# Delete a template exercise
@template_exercises_bp.route('/template-exercises/<int:te_id>', methods=['DELETE'])
@login_required
def delete_template_exercise(te_id):
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            DELETE FROM template_exercises te
            USING workout_templates wt
            WHERE te.id = %s AND te.template_id = wt.id AND wt.user_id = %s
        """, (te_id, user_id))
        conn.commit()
        return jsonify({"success": True, "message": "Template exercise deleted"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)