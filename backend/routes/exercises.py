from db import get_db, return_db
from flask import Blueprint
from utils.logging import log_activity
from flask import request, jsonify, g
from utils.auth import login_required

exercises_bp = Blueprint('exercises', __name__)


@exercises_bp.route('/exercises/create', methods=['POST'])
@login_required
def create_exercise():
   
    data = request.json
    name = data.get('name')
    category = data.get('category')
    description = data.get('description', '')
    
    if not name or not category:
        return {"message": "Missing required fields"}, 400
    
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO exercises (name, category, description)
            VALUES (%s, %s, %s)
            RETURNING id
        """, (name, category, description))
        exercise_id = cursor.fetchone()[0]
        conn.commit()

        log_activity(g.user['id'],"exercise_created", "exercise", exercise_id)
        return jsonify({"success": True, "exercise_id": exercise_id}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)



@exercises_bp.route('/exercises', methods=['GET'])
@login_required
def get_exercises():
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id, name, category, description
            FROM exercises
            ORDER BY name
        """,)
        exercises = [
            {"id": row[0], "name": row[1], "category": row[2], "description": row[3]}
            for row in cursor.fetchall()
        ]
        return jsonify({"success":True, "exercises": exercises}), 200
    finally:
        cursor.close()
        return_db(conn)


@exercises_bp.route('/exercises/<int:exercise_id>', methods=['GET'])
@login_required
def get_exercise(exercise_id):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id, name, category, description
            FROM exercises
            WHERE id=%s 
        """, (exercise_id,))
        row = cursor.fetchone()
        if row:
            exercise = {"id": row[0], "name": row[1], "category": row[2], "description": row[3]}
            return jsonify(exercise)
        else:
            return {"message": "Exercise not found"}, 404
    finally:
        cursor.close()
        return_db(conn)

@exercises_bp.route('/exercises/<int:exercise_id>', methods=['PUT'])
@login_required
def update_exercise(exercise_id):


    data = request.json
    name = data.get('name')
    category = data.get('category')
    description = data.get('description', '')

    if not name or not category:
        return {"message": "Missing required fields"}, 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM exercises WHERE id=%s", (exercise_id, ))
        if not cursor.fetchone():
            return {"message": "Exercise not found"}, 404

        cursor.execute("""
            UPDATE exercises
            SET name=%s, category=%s, description=%s
            WHERE id=%s
        """, (name, category, description, exercise_id))
        conn.commit()
        log_activity(g.user['id'], "exercise_updated", "exercise", exercise_id)
        return {"success": True}, 200
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}, 500
    finally:
        cursor.close()
        return_db(conn)
 

@exercises_bp.route('/exercises/<int:exercise_id>', methods=['DELETE'])
@login_required
def delete_exercise(exercise_id):
    
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM exercises WHERE id=%s ", (exercise_id,))
        if not cursor.fetchone():
            return jsonify({"success": False, "message": "Exercise not found"}), 404

        cursor.execute("DELETE FROM workout_exercises WHERE exercise_id=%s", (exercise_id,))
        cursor.execute("DELETE FROM exercises WHERE id=%s", (exercise_id,))
        conn.commit()
        log_activity(g.user['id'], "exercise_deleted", "exercise", exercise_id)
        return jsonify({"success": True, "message": "Exercise deleted"}), 200
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        return_db(conn)

