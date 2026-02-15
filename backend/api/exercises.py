from flask import Blueprint, request, jsonify, g, current_app
from app import db
from models import Exercise
from utils.logging import log_activity
from api.auth import login_required

exercises_bp = Blueprint('exercises', __name__)


@exercises_bp.route('/exercises/create', methods=['POST'])
@login_required
def create_exercise():
    data = request.json
    name = data.get('name')
    category = data.get('category')
    description = data.get('description', '')
    
    if not name or not category:
        return jsonify({"message": "Missing required fields"}), 400
    
    try:
        exercise = Exercise(
            user_id=g.user['id'],
            name=name,
            category=category,
            description=description,
            created_by=g.user['id']
        )
        
        db.session.add(exercise)
        db.session.commit()
        
        log_activity(g.user['id'], "exercise_created", "exercise", exercise.id)
        
        return jsonify({
            "success": True, 
            "exercise_id": exercise.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating exercise: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@exercises_bp.route('/exercises', methods=['GET'])
@login_required
def get_exercises():
    """
    Fetch exercises visible to the current user.
    Supports optional filters: search, category, muscle_group
    """
    search = request.args.get('search', '').strip()
    category = request.args.get('category', '').strip()
    muscle_group = request.args.get('muscle_group', '').strip()
    
    try:
        # Start with base query
        query = Exercise.query.filter(
            db.or_(
                Exercise.is_global == True,
                Exercise.created_by == g.user['id']
            )
        )
        
        # Apply search filter
        if search:
            query = query.filter(Exercise.name.ilike(f"%{search}%"))
        
        # Apply category filter
        if category:
            query = query.filter(Exercise.category == category)
        
        # Apply muscle_group filter
        if muscle_group:
            query = query.filter(Exercise.muscle_group == muscle_group)
        
        # Execute query
        exercises = query.order_by(Exercise.name).all()
        
        result = [exercise.to_dict() for exercise in exercises]
        
        return jsonify({"success": True, "exercises": result}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching exercises: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@exercises_bp.route('/exercises/<int:exercise_id>', methods=['GET'])
@login_required
def get_exercise(exercise_id):
    try:
        exercise = Exercise.query.get(exercise_id)
        
        if not exercise:
            return jsonify({"message": "Exercise not found"}), 404
        
        return jsonify(exercise.to_dict()), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching exercise: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@exercises_bp.route('/exercises/<int:exercise_id>', methods=['PUT'])
@login_required
def update_exercise(exercise_id):
    data = request.json
    name = data.get('name')
    category = data.get('category')
    description = data.get('description', '')
    
    if not name or not category:
        return jsonify({"message": "Missing required fields"}), 400
    
    try:
        exercise = Exercise.query.get(exercise_id)
        
        if not exercise:
            return jsonify({"message": "Exercise not found"}), 404
        
        # Update fields
        exercise.name = name
        exercise.category = category
        exercise.description = description
        
        db.session.commit()
        
        log_activity(g.user['id'], "exercise_updated", "exercise", exercise_id)
        
        return jsonify({"success": True}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating exercise: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@exercises_bp.route('/exercises/<int:exercise_id>', methods=['DELETE'])
@login_required
def delete_exercise(exercise_id):
    try:
        exercise = Exercise.query.get(exercise_id)
        
        if not exercise:
            return jsonify({"success": False, "message": "Exercise not found"}), 404
        
        # WorkoutExercises will be deleted automatically via cascade
        db.session.delete(exercise)
        db.session.commit()
        
        log_activity(g.user['id'], "exercise_deleted", "exercise", exercise_id)
        
        return jsonify({"success": True, "message": "Exercise deleted"}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting exercise: {e}")
        return jsonify({"success": False, "message": str(e)}), 500