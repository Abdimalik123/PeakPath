from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models import Workout, WorkoutExercise, Exercise
from api.auth import login_required
from utils.logging import log_activity
from utils.validators import validate_request, WorkoutSchema
from utils.rewards import on_workout_logged
from utils.pr_tracker import check_and_update_prs
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
            notes=data.get('notes'),
            rpe=data.get('rpe')
        )
        
        db.session.add(workout)
        db.session.flush()  # Get workout.id without committing
        
        # Add exercises if provided
        exercises_data = data.get('exercises', [])
        for ex_data in exercises_data:
            exercise_id = ex_data.get('exercise_id')
            
            # If no exercise_id but exercise_name provided, look up or create
            if not exercise_id and ex_data.get('exercise_name'):
                exercise = Exercise.query.filter_by(
                    name=ex_data['exercise_name'],
                    user_id=g.user['id']
                ).first()
                if not exercise:
                    # Also check for global/shared exercises (user_id=None or any user)
                    exercise = Exercise.query.filter_by(
                        name=ex_data['exercise_name']
                    ).first()
                if not exercise:
                    exercise = Exercise(
                        name=ex_data['exercise_name'],
                        user_id=g.user['id']
                    )
                    db.session.add(exercise)
                    db.session.flush()
                exercise_id = exercise.id
            
            if not exercise_id:
                continue  # Skip exercises with no valid ID or name
            
            workout_exercise = WorkoutExercise(
                workout_id=workout.id,
                exercise_id=exercise_id,
                sets=ex_data.get('sets'),
                reps=ex_data.get('reps'),
                weight=ex_data.get('weight'),
                duration=ex_data.get('duration'),
                notes=ex_data.get('notes')
            )
            db.session.add(workout_exercise)
        
        db.session.commit()
        log_activity(g.user['id'], "created", "workout", workout.id)

        # Check for PRs
        workout_exercises = WorkoutExercise.query.filter_by(workout_id=workout.id).all()
        prs_achieved = check_and_update_prs(g.user['id'], workout.id, workout_exercises)

        # Award points, check achievements, sync goals
        on_workout_logged(g.user['id'], workout)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Workout logged successfully",
            "workout_id": workout.id,
            "workout": workout.to_dict(),
            "prs_achieved": prs_achieved
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


@workouts_bp.route('/workouts/last', methods=['GET'])
@login_required
def get_last_workout():
    """Get the most recent workout to enable quick repeat"""
    try:
        last_workout = Workout.query.filter_by(
            user_id=g.user['id']
        ).order_by(
            desc(Workout.date),
            desc(Workout.created_at)
        ).first()

        if not last_workout:
            return jsonify({
                "success": False,
                "message": "No previous workouts found"
            }), 404

        workout_dict = last_workout.to_dict()
        workout_dict['exercises'] = []

        for we in last_workout.exercises:
            exercise = Exercise.query.get(we.exercise_id)
            if not exercise:
                continue
            workout_dict['exercises'].append({
                'exercise_id': exercise.id,
                'exercise_name': exercise.name,
                'category': exercise.category,
                'muscle_group': exercise.muscle_group,
                'sets': we.sets,
                'reps': we.reps,
                'weight': float(we.weight) if we.weight else None,
                'duration': we.duration,
                'notes': we.notes
            })

        return jsonify({
            "success": True,
            "workout": workout_dict
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching last workout: {e}")
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500


@workouts_bp.route('/workouts/<int:workout_id>/duplicate', methods=['POST'])
@login_required
def duplicate_workout(workout_id):
    """Duplicate an existing workout with today's date"""
    try:
        original_workout = Workout.query.filter_by(
            id=workout_id,
            user_id=g.user['id']
        ).first()

        if not original_workout:
            return jsonify({
                "success": False,
                "message": "Workout not found"
            }), 404

        new_workout = Workout(
            user_id=g.user['id'],
            type=original_workout.type,
            duration=original_workout.duration,
            date=datetime.now().date(),
            notes=original_workout.notes
        )

        db.session.add(new_workout)
        db.session.flush()

        for original_exercise in original_workout.exercises:
            new_exercise = WorkoutExercise(
                workout_id=new_workout.id,
                exercise_id=original_exercise.exercise_id,
                sets=original_exercise.sets,
                reps=original_exercise.reps,
                weight=original_exercise.weight,
                duration=original_exercise.duration,
                rest_time=original_exercise.rest_time,
                notes=original_exercise.notes
            )
            db.session.add(new_exercise)

        db.session.commit()

        log_activity(g.user['id'], "created", "workout", new_workout.id)

        workout_exercises = WorkoutExercise.query.filter_by(workout_id=new_workout.id).all()
        prs_achieved = check_and_update_prs(g.user['id'], new_workout.id, workout_exercises)

        on_workout_logged(g.user['id'], new_workout)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Workout duplicated successfully",
            "workout_id": new_workout.id,
            "prs_achieved": prs_achieved
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error duplicating workout: {e}")
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
            if not exercise:
                continue
            workout_dict['exercises'].append({
                'exercise_id': exercise.id,
                'name': exercise.name,
                'category': exercise.category,
                'muscle_group': exercise.muscle_group,
                'sets': we.sets,
                'reps': we.reps,
                'weight': float(we.weight) if we.weight else None,
                'duration': we.duration,
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
        if 'rpe' in data:
            workout.rpe = data['rpe']

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


@workouts_bp.route('/workouts/<int:workout_id>/exercises', methods=['POST'])
@login_required
def add_exercise_to_workout(workout_id):
    data = request.get_json()
    
    try:
        # Verify workout exists and belongs to user
        workout = Workout.query.filter_by(
            id=workout_id,
            user_id=g.user['id']
        ).first()
        
        if not workout:
            return jsonify({
                "success": False, 
                "message": "Workout not found"
            }), 404
        
        # Verify exercise exists
        exercise_id = data.get('exercise_id')
        exercise = Exercise.query.get(exercise_id)
        if not exercise:
            return jsonify({
                "success": False,
                "message": "Exercise not found"
            }), 404
        
        # Add exercise to workout
        workout_exercise = WorkoutExercise(
            workout_id=workout_id,
            exercise_id=exercise_id,
            sets=data.get('sets'),
            reps=data.get('reps'),
            weight=data.get('weight'),
            duration=data.get('duration'),
            notes=data.get('notes')
        )
        
        db.session.add(workout_exercise)
        db.session.commit()
        
        log_activity(g.user['id'], "added", "exercise_to_workout", workout_exercise.id)
        
        return jsonify({
            "success": True,
            "message": "Exercise added to workout successfully",
            "exercise": {
                'exercise_id': exercise.id,
                'name': exercise.name,
                'sets': workout_exercise.sets,
                'reps': workout_exercise.reps,
                'weight': float(workout_exercise.weight) if workout_exercise.weight else None,
                'duration': workout_exercise.duration,
                'notes': workout_exercise.notes
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding exercise to workout: {e}")
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500