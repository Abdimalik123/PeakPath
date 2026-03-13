from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models import WorkoutTemplate, TemplateExercise, Exercise
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
        return jsonify({"success": False, "message": "Name is required"}), 400

    try:
        template = WorkoutTemplate(
            user_id=user_id,
            name=name,
            description=description
        )
        
        db.session.add(template)
        db.session.commit()
        
        log_activity(user_id, "created", "workout_template", template.id)
        
        return jsonify({"success": True, "template_id": template.id}), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating workout template: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


def _serialize_template(t):
    """Serialize a WorkoutTemplate with its exercises."""
    template_exercises = TemplateExercise.query.filter_by(
        template_id=t.id
    ).order_by(TemplateExercise.order_index).all()

    exercises = []
    for te in template_exercises:
        exercise = Exercise.query.get(te.exercise_id)
        if not exercise:
            continue
        exercises.append({
            'exercise_id': te.exercise_id,
            'name': exercise.name,
            'sets': te.sets,
            'reps': te.reps or '',
            'order_index': te.order_index,
            'weight': float(te.weight) if te.weight else None,
            'rest': te.rest_time,
            'notes': te.notes
        })

    return {
        "id": str(t.id),
        "name": t.name,
        "description": t.description or '',
        "is_system": t.is_system,
        "category": t.category or ('custom' if not t.is_system else ''),
        "difficulty": t.difficulty or 'intermediate',
        "duration_minutes": t.duration_minutes or 0,
        # Keep legacy "duration" field for backward compat with Workouts.tsx
        "duration": t.duration_minutes or 0,
        "exercises": exercises,
        "created_at": t.created_at.isoformat() if t.created_at else None
    }


# Get all templates — system templates + user's own templates
@workout_templates_bp.route('/workout-templates', methods=['GET'])
@login_required
def get_workout_templates():
    user_id = g.user['id']

    try:
        system = WorkoutTemplate.query.filter_by(is_system=True).order_by(WorkoutTemplate.name).all()
        user_templates = WorkoutTemplate.query.filter_by(user_id=user_id, is_system=False).all()

        system_list = [_serialize_template(t) for t in system]
        user_list = [_serialize_template(t) for t in user_templates]

        # Keep legacy "templates" key pointing to user templates for backward compat
        return jsonify({
            "success": True,
            "system_templates": system_list,
            "user_templates": user_list,
            "templates": user_list
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching workout templates: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


# Update template
@workout_templates_bp.route('/workout-templates/<int:template_id>', methods=['PUT'])
@login_required
def update_workout_template(template_id):
    user_id = g.user['id']
    data = request.get_json()
    name = data.get("name")
    description = data.get("description")

    try:
        template = WorkoutTemplate.query.filter_by(
            id=template_id,
            user_id=user_id
        ).first()
        
        if not template:
            return jsonify({"success": False, "message": "Template not found"}), 404

        # Update fields if provided
        if name:
            template.name = name
        if description is not None:
            template.description = description

        db.session.commit()
        
        log_activity(user_id, "updated", "workout_template", template_id)
        
        return jsonify({"success": True, "message": "Template updated"}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating workout template: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


# Delete template
@workout_templates_bp.route('/workout-templates/<int:template_id>', methods=['DELETE'])
@login_required
def delete_workout_template(template_id):
    user_id = g.user['id']
    
    try:
        template = WorkoutTemplate.query.filter_by(
            id=template_id,
            user_id=user_id
        ).first()
        
        if not template:
            return jsonify({"success": False, "message": "Template not found"}), 404
        
        db.session.delete(template)
        db.session.commit()
        
        log_activity(user_id, "deleted", "workout_template", template_id)
        
        return jsonify({"success": True, "message": "Template deleted"}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting workout template: {e}")
        return jsonify({"success": False, "message": str(e)}), 500