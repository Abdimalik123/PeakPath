from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models import WorkoutTemplate, TemplateExercise, Exercise
from api.auth import admin_required
from datetime import datetime

admin_templates_bp = Blueprint('admin_templates_bp', __name__)


def _serialize_template(t):
    template_exercises = TemplateExercise.query.filter_by(
        template_id=t.id
    ).order_by(TemplateExercise.order_index).all()

    exercises = []
    for te in template_exercises:
        exercise = Exercise.query.get(te.exercise_id)
        if not exercise:
            continue
        exercises.append({
            'id': te.id,
            'exercise_id': te.exercise_id,
            'name': exercise.name,
            'sets': te.sets,
            'reps': te.reps or '',
            'order_index': te.order_index,
        })

    return {
        "id": str(t.id),
        "name": t.name,
        "description": t.description or '',
        "is_system": t.is_system,
        "category": t.category or '',
        "difficulty": t.difficulty or '',
        "duration_minutes": t.duration_minutes,
        "exercises": exercises,
    }


# POST /admin/templates — create a system template with exercises
@admin_templates_bp.route('/admin/templates', methods=['POST'])
@admin_required
def create_system_template():
    data = request.get_json()
    name = data.get('name', '').strip()
    if not name:
        return jsonify({"success": False, "message": "Name is required"}), 400

    try:
        template = WorkoutTemplate(
            user_id=None,
            name=name,
            description=data.get('description', ''),
            is_system=True,
            difficulty=data.get('difficulty'),
            category=data.get('category'),
            duration_minutes=data.get('duration_minutes'),
            created_at=datetime.utcnow()
        )
        db.session.add(template)
        db.session.flush()

        exercises_data = data.get('exercises', [])
        for idx, ex_data in enumerate(exercises_data):
            exercise_id = ex_data.get('exercise_id')
            if not exercise_id:
                continue
            exercise = Exercise.query.get(exercise_id)
            if not exercise:
                continue
            te = TemplateExercise(
                template_id=template.id,
                exercise_id=exercise_id,
                sets=ex_data.get('sets'),
                reps=str(ex_data.get('reps', '')) if ex_data.get('reps') is not None else None,
                order_index=ex_data.get('order_index', idx + 1),
            )
            db.session.add(te)

        db.session.commit()
        return jsonify({"success": True, "template": _serialize_template(template)}), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating system template: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


# PUT /admin/templates/<id> — update a system template
@admin_templates_bp.route('/admin/templates/<int:template_id>', methods=['PUT'])
@admin_required
def update_system_template(template_id):
    data = request.get_json()

    try:
        template = WorkoutTemplate.query.filter_by(id=template_id, is_system=True).first()
        if not template:
            return jsonify({"success": False, "message": "System template not found"}), 404

        if 'name' in data and data['name']:
            template.name = data['name'].strip()
        if 'description' in data:
            template.description = data['description']
        if 'difficulty' in data:
            template.difficulty = data['difficulty']
        if 'category' in data:
            template.category = data['category']
        if 'duration_minutes' in data:
            template.duration_minutes = data['duration_minutes']

        db.session.commit()
        return jsonify({"success": True, "template": _serialize_template(template)}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating system template: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


# DELETE /admin/templates/<id> — delete a system template
@admin_templates_bp.route('/admin/templates/<int:template_id>', methods=['DELETE'])
@admin_required
def delete_system_template(template_id):
    try:
        template = WorkoutTemplate.query.filter_by(id=template_id, is_system=True).first()
        if not template:
            return jsonify({"success": False, "message": "System template not found"}), 404

        db.session.delete(template)
        db.session.commit()
        return jsonify({"success": True, "message": "System template deleted"}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting system template: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


# POST /admin/templates/<id>/exercises — add exercise to a system template
@admin_templates_bp.route('/admin/templates/<int:template_id>/exercises', methods=['POST'])
@admin_required
def add_exercise_to_system_template(template_id):
    data = request.get_json()

    try:
        template = WorkoutTemplate.query.filter_by(id=template_id, is_system=True).first()
        if not template:
            return jsonify({"success": False, "message": "System template not found"}), 404

        exercise_id = data.get('exercise_id')
        if not exercise_id:
            return jsonify({"success": False, "message": "exercise_id is required"}), 400

        exercise = Exercise.query.get(exercise_id)
        if not exercise:
            return jsonify({"success": False, "message": "Exercise not found"}), 404

        te = TemplateExercise(
            template_id=template_id,
            exercise_id=exercise_id,
            sets=data.get('sets'),
            reps=str(data['reps']) if data.get('reps') is not None else None,
            order_index=data.get('order_index'),
        )
        db.session.add(te)
        db.session.commit()

        return jsonify({"success": True, "template_exercise_id": te.id}), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding exercise to system template: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


# DELETE /admin/templates/<id>/exercises/<te_id> — remove exercise from system template
@admin_templates_bp.route('/admin/templates/<int:template_id>/exercises/<int:te_id>', methods=['DELETE'])
@admin_required
def remove_exercise_from_system_template(template_id, te_id):
    try:
        template = WorkoutTemplate.query.filter_by(id=template_id, is_system=True).first()
        if not template:
            return jsonify({"success": False, "message": "System template not found"}), 404

        te = TemplateExercise.query.filter_by(id=te_id, template_id=template_id).first()
        if not te:
            return jsonify({"success": False, "message": "Template exercise not found"}), 404

        db.session.delete(te)
        db.session.commit()
        return jsonify({"success": True, "message": "Exercise removed from template"}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error removing exercise from system template: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
