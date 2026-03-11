from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models import Exercise, Workout, WorkoutExercise
from sqlalchemy import func
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
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    
    try:
        # Check if exercise already exists (names are globally unique, case-insensitive)
        existing = Exercise.query.filter(
            func.lower(Exercise.name) == name.strip().lower()
        ).first()
        if existing:
            return jsonify({"success": True, "exercise_id": existing.id}), 200

        exercise = Exercise(
            user_id=g.user['id'],
            name=name.strip(),
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
        # Names are globally unique — return all exercises
        query = Exercise.query
        
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
        
        result = []
        for exercise in exercises:
            ex_dict = exercise.to_dict()
            # Fetch last performance for this exercise
            last_we = db.session.query(WorkoutExercise).join(
                Workout, WorkoutExercise.workout_id == Workout.id
            ).filter(
                WorkoutExercise.exercise_id == exercise.id,
                Workout.user_id == g.user['id']
            ).order_by(Workout.date.desc(), Workout.created_at.desc()).first()
            if last_we:
                ex_dict['last_performance'] = {
                    'weight': float(last_we.weight) if last_we.weight else None,
                    'reps': last_we.reps,
                    'sets': last_we.sets,
                    'date': last_we.workout.date.isoformat() if last_we.workout and last_we.workout.date else None
                }
            else:
                ex_dict['last_performance'] = None
            result.append(ex_dict)

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
            return jsonify({"success": False, "message": "Exercise not found"}), 404
        
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
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    
    try:
        exercise = Exercise.query.get(exercise_id)
        
        if not exercise:
            return jsonify({"success": False, "message": "Exercise not found"}), 404
        
        # Update fields
        exercise.name = name
        exercise.category = category
        exercise.description = description
        
        db.session.commit()
        
        log_activity(g.user['id'], "exercise_updated", "exercise", exercise_id)
        
        return jsonify({"success": True, "message": "Exercise updated successfully"}), 200
        
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