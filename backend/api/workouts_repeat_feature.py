"""
Add this endpoint to backend/api/workouts.py
Place it after the get_workouts() function
"""

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
        
        # Get workout with exercises
        workout_dict = last_workout.to_dict()
        workout_dict['exercises'] = []
        
        for we in last_workout.exercises:
            exercise = Exercise.query.get(we.exercise_id)
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
        
        # Create new workout with today's date
        new_workout = Workout(
            user_id=g.user['id'],
            type=original_workout.type,
            duration=original_workout.duration,
            date=datetime.now().date(),
            notes=original_workout.notes
        )
        
        db.session.add(new_workout)
        db.session.flush()  # Get new workout ID
        
        # Copy all exercises
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
        
        # Check for PRs
        workout_exercises = WorkoutExercise.query.filter_by(workout_id=new_workout.id).all()
        prs_achieved = check_and_update_prs(g.user['id'], new_workout.id, workout_exercises)
        
        # Award points
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