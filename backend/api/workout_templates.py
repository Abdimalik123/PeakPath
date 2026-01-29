from flask import Blueprint, request, jsonify, g
from db import get_db, return_db
from api.auth import login_required
from utils.logging import log_activity

workout_templates_bp = Blueprint('workout_templates_bp', __name__)

# Create a new workout template
@workout_templates_bp.route('/workout-templates', methods=['POST'])
@login_required
def add_workout_template():
    user_id = g.user['id']
    data = request.get_json()
    name = data.get("name")
    description = data.get("description")

    if not name:
        return jsonify({"error": "Name is required"}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO workout_templates (user_id, name, description, created_at)
            VALUES (%s, %s, %s, CURRENT_TIMESTAMP) RETURNING id
        """, (user_id, name, description))
        template_id = cursor.fetchone()[0]
        conn.commit()
        log_activity(user_id, "created", "workout_template", template_id)
        return jsonify({"success": True, "template_id": template_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)

# Get all templates for user
@workout_templates_bp.route('/workout-templates', methods=['GET'])
@login_required
def get_workout_templates():
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id, name, description, created_at
            FROM workout_templates
            WHERE user_id = %s
        """, (user_id,))
        templates = cursor.fetchall()
        result = [{"id": t[0], "name": t[1], "description": t[2], "created_at": t[3]} for t in templates]
        return jsonify({"success": True, "templates": result}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)

# Update template
@workout_templates_bp.route('/workout-templates/<int:template_id>', methods=['PUT'])
@login_required
def update_workout_template(template_id):
    user_id = g.user['id']
    data = request.get_json()
    name = data.get("name")
    description = data.get("description")

    conn = get_db()
    cursor = conn.cursor()
    try:
        # Check existing
        cursor.execute("""
            SELECT name, description 
            FROM workout_templates 
            WHERE id = %s AND user_id = %s
        """, (template_id, user_id))
        existing = cursor.fetchone()
        if not existing:
            return jsonify({"success": False, "message": "Template not found"}), 404

        new_name = name if name else existing[0]
        new_description = description if description else existing[1]

        cursor.execute("""
            UPDATE workout_templates
            SET name = %s, description = %s
            WHERE id = %s AND user_id = %s
        """, (new_name, new_description, template_id, user_id))
        conn.commit()
        log_activity(user_id, "updated", "workout_template", template_id)
        return jsonify({"success": True, "message": "Template updated"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)

# Delete template
@workout_templates_bp.route('/workout-templates/<int:template_id>', methods=['DELETE'])
@login_required
def delete_workout_template(template_id):
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            DELETE FROM workout_templates
            WHERE id = %s AND user_id = %s
        """, (template_id, user_id))
        conn.commit()
        log_activity(user_id, "deleted", "workout_template", template_id)
        return jsonify({"success": True, "message": "Template deleted"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)

