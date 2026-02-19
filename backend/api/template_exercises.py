from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models import TemplateExercise, Exercise, WorkoutTemplate
from api.auth import login_required

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
        return jsonify({"success": False, "message": "Template ID and Exercise ID are required"}), 400

    try:
        # Verify template belongs to user
        template = WorkoutTemplate.query.filter_by(
            id=template_id,
            user_id=user_id
        ).first()
        
        if not template:
            return jsonify({"success": False, "message": "Template not found"}), 404
        
        # Create template exercise
        template_exercise = TemplateExercise(
            template_id=template_id,
            exercise_id=exercise_id,
            sets=sets,
            reps=reps,
            weight=weight,
            duration=duration,
            rest_time=rest_time,
            order_index=order_index,
            notes=notes
        )
        
        db.session.add(template_exercise)
        db.session.commit()
        
        return jsonify({"success": True, "template_exercise_id": template_exercise.id}), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding template exercise: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


# Get all exercises in a template
@template_exercises_bp.route('/template-exercises/<int:template_id>', methods=['GET'])
@login_required
def get_template_exercises(template_id):
    user_id = g.user['id']
    
    try:
        # Verify template belongs to user
        template = WorkoutTemplate.query.filter_by(
            id=template_id,
            user_id=user_id
        ).first()
        
        if not template:
            return jsonify({"success": False, "message": "Template not found"}), 404
        
        # Get template exercises with exercise details
        template_exercises = TemplateExercise.query.filter_by(
            template_id=template_id
        ).order_by(
            TemplateExercise.order_index
        ).all()
        
        result = []
        for te in template_exercises:
            exercise = Exercise.query.get(te.exercise_id)
            result.append({
                "id": te.id,
                "exercise_id": te.exercise_id,
                "name": exercise.name if exercise else None,
                "sets": te.sets,
                "reps": te.reps,
                "weight": te.weight,
                "duration": te.duration,
                "rest_time": te.rest_time,
                "order_index": te.order_index,
                "notes": te.notes
            })
        
        return jsonify({"success": True, "exercises": result}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching template exercises: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


# Update a template exercise
@template_exercises_bp.route('/template-exercises/<int:te_id>', methods=['PUT'])
@login_required
def update_template_exercise(te_id):
    user_id = g.user['id']
    data = request.get_json()

    try:
        # Get template exercise and verify user owns the template
        template_exercise = db.session.query(TemplateExercise).join(
            WorkoutTemplate
        ).filter(
            TemplateExercise.id == te_id,
            WorkoutTemplate.user_id == user_id
        ).first()
        
        if not template_exercise:
            return jsonify({"success": False, "message": "Template exercise not found"}), 404

        # Update fields if provided
        if data.get("sets") is not None:
            template_exercise.sets = data["sets"]
        if data.get("reps") is not None:
            template_exercise.reps = data["reps"]
        if data.get("weight") is not None:
            template_exercise.weight = data["weight"]
        if data.get("duration") is not None:
            template_exercise.duration = data["duration"]
        if data.get("rest_time") is not None:
            template_exercise.rest_time = data["rest_time"]
        if data.get("order_index") is not None:
            template_exercise.order_index = data["order_index"]
        if data.get("notes") is not None:
            template_exercise.notes = data["notes"]

        db.session.commit()
        
        return jsonify({"success": True, "message": "Template exercise updated"}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating template exercise: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


# Delete a template exercise
@template_exercises_bp.route('/template-exercises/<int:te_id>', methods=['DELETE'])
@login_required
def delete_template_exercise(te_id):
    user_id = g.user['id']
    
    try:
        # Get template exercise and verify user owns the template
        template_exercise = db.session.query(TemplateExercise).join(
            WorkoutTemplate
        ).filter(
            TemplateExercise.id == te_id,
            WorkoutTemplate.user_id == user_id
        ).first()
        
        if not template_exercise:
            return jsonify({"success": False, "message": "Template exercise not found"}), 404
        
        db.session.delete(template_exercise)
        db.session.commit()
        
        return jsonify({"success": True, "message": "Template exercise deleted"}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting template exercise: {e}")
        return jsonify({"success": False, "message": str(e)}), 500