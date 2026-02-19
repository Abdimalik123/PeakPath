from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models import Workout, WorkoutExercise, Exercise
from api.auth import login_required
from utils.logging import log_activity
from utils.validators import validate_request, WorkoutSchema
from utils.rewards import on_workout_logged
from sqlalchemy import desc
from datetime import datetime

workouts_bp = Blueprint('workouts_bp', __name__)

@workouts_bp.route('/workouts', methods=['POST'])
@login_required
@validate_request(WorkoutSchema)
def create_workout():
    data = request.validated_data
    
    try:
        # Create workout
        workout = Workout(
            user_id=g.user['id'],
            type=data['type'],
            duration=data['duration'],
            date=data.get('date', datetime.now().date()),
            notes=data.get('notes')
        )
        
        db.session.add(workout)
        db.session.flush()  # Get workout.id without committing
        
        # Add exercises if provided
        exercises_data = data.get('exercises', [])
        for ex_data in exercises_data:
            workout_exercise = WorkoutExercise(
                workout_id=workout.id,
                exercise_id=ex_data['exercise_id'],
                sets=ex_data.get('sets'),
                reps=ex_data.get('reps'),
                weight=ex_data.get('weight'),
                duration=ex_data.get('duration'),
                notes=ex_data.get('notes')
            )
            db.session.add(workout_exercise)
        
        db.session.commit()
        log_activity(g.user['id'], "created", "workout", workout.id)

        # Award points, check achievements, sync goals
        on_workout_logged(g.user['id'], workout)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Workout logged successfully",
            "workout_id": workout.id,
            "workout": workout.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating workout: {e}")
        return jsonify({
            "success": False, 
            "message": "Internal server error"
        }), 500


@workouts_bp.route('/workouts', methods=['GET'])
@login_required
def get_workouts():
    try:
        workouts = Workout.query.filter_by(
            user_id=g.user['id']
        ).order_by(
            desc(Workout.date), 
            desc(Workout.created_at)
        ).all()
        
        result = [workout.to_dict() for workout in workouts]
        return jsonify({"success": True, "workouts": result}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching workouts: {e}")
        return jsonify({
            "success": False, 
            "message": "Internal server error"
        }), 500


@workouts_bp.route('/workouts/<int:workout_id>', methods=['GET'])
@login_required
def get_workout(workout_id):
    try:
        workout = Workout.query.filter_by(
            id=workout_id,
            user_id=g.user['id']
        ).first()
        
        if not workout:
            return jsonify({
                "success": False, 
                "message": "Workout not found"
            }), 404
        
        # Get workout with exercises
        workout_dict = workout.to_dict()
        workout_dict['exercises'] = []
        
        for we in workout.exercises:
            exercise = Exercise.query.get(we.exercise_id)
            workout_dict['exercises'].append({
                'id': exercise.id,
                'name': exercise.name,
                'category': exercise.category,
                'muscle_group': exercise.muscle_group,
                'sets': we.sets,
                'reps': we.reps,
                'weight': float(we.weight) if we.weight else None,
                'notes': we.notes
            })
        
        return jsonify({"success": True, "workout": workout_dict}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching workout: {e}")
        return jsonify({
            "success": False, 
            "message": "Internal server error"
        }), 500


@workouts_bp.route('/workouts/<int:workout_id>', methods=['PUT'])
@login_required
def update_workout(workout_id):
    data = request.get_json()
    
    try:
        workout = Workout.query.filter_by(
            id=workout_id,
            user_id=g.user['id']
        ).first()
        
        if not workout:
            return jsonify({
                "success": False, 
                "message": "Workout not found"
            }), 404
        
        # Update fields
        if 'type' in data:
            workout.type = data['type']
        if 'duration' in data:
            workout.duration = data['duration']
        if 'date' in data:
            workout.date = data['date']
        if 'notes' in data:
            workout.notes = data['notes']
        
        db.session.commit()
        log_activity(g.user['id'], "updated", "workout", workout_id)
        
        return jsonify({
            "success": True, 
            "message": "Workout updated successfully"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating workout: {e}")
        return jsonify({
            "success": False, 
            "message": "Internal server error"
        }), 500


@workouts_bp.route('/workouts/<int:workout_id>', methods=['DELETE'])
@login_required
def delete_workout(workout_id):
    try:
        workout = Workout.query.filter_by(
            id=workout_id,
            user_id=g.user['id']
        ).first()
        
        if not workout:
            return jsonify({
                "success": False, 
                "message": "Workout not found"
            }), 404
        
        db.session.delete(workout)
        db.session.commit()
        
        log_activity(g.user['id'], "deleted", "workout", workout_id)
        
        return jsonify({
            "success": True, 
            "message": "Workout deleted successfully"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting workout: {e}")
        return jsonify({
            "success": False, 
            "message": "Internal server error"
        }), 500