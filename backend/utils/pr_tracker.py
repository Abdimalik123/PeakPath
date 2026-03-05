"""
Personal Record (PR) tracking and detection system.
Automatically detects and records PRs when workouts are logged.
"""
from database import db
from models.personal_record import PersonalRecord
from models import WorkoutExercise, Exercise
from datetime import datetime
from flask import current_app


def calculate_one_rep_max(weight, reps):
    """
    Calculate estimated 1RM using Epley formula.
    1RM = weight × (1 + reps/30)
    """
    if not weight or not reps or reps < 1:
        return None
    return weight * (1 + reps / 30)


def check_and_update_prs(user_id, workout_id, workout_exercises):
    """
    Check if any exercises in the workout are new PRs.
    Returns list of PR achievements.
    """
    prs_achieved = []
    
    try:
        for we in workout_exercises:
            exercise_id = we.exercise_id
            
            # Get or create PR record for this exercise
            pr = PersonalRecord.query.filter_by(
                user_id=user_id,
                exercise_id=exercise_id
            ).first()
            
            if not pr:
                pr = PersonalRecord(
                    user_id=user_id,
                    exercise_id=exercise_id
                )
                db.session.add(pr)
            
            # Calculate metrics for this set
            current_weight = float(we.weight) if we.weight else 0
            current_reps = we.reps if we.reps else 0
            current_volume = current_weight * current_reps * (we.sets if we.sets else 1)
            current_1rm = calculate_one_rep_max(current_weight, current_reps)
            
            pr_types = []
            
            # Check for max weight PR
            if current_weight > 0 and (not pr.max_weight or current_weight > pr.max_weight):
                pr.max_weight = current_weight
                pr.workout_id = workout_id
                pr.workout_exercise_id = we.id
                pr.achieved_at = datetime.utcnow()
                pr_types.append('max_weight')
            
            # Check for max reps PR (at same or higher weight)
            if current_reps > 0 and (not pr.max_reps or current_reps > pr.max_reps):
                pr.max_reps = current_reps
                if 'max_weight' not in pr_types:
                    pr.workout_id = workout_id
                    pr.workout_exercise_id = we.id
                    pr.achieved_at = datetime.utcnow()
                pr_types.append('max_reps')
            
            # Check for max volume PR
            if current_volume > 0 and (not pr.max_volume or current_volume > pr.max_volume):
                pr.max_volume = current_volume
                if not pr_types:
                    pr.workout_id = workout_id
                    pr.workout_exercise_id = we.id
                    pr.achieved_at = datetime.utcnow()
                pr_types.append('max_volume')
            
            # Check for 1RM PR
            if current_1rm and (not pr.best_one_rep_max or current_1rm > pr.best_one_rep_max):
                pr.best_one_rep_max = current_1rm
                if not pr_types:
                    pr.workout_id = workout_id
                    pr.workout_exercise_id = we.id
                    pr.achieved_at = datetime.utcnow()
                pr_types.append('one_rep_max')
            
            # If any PRs were achieved, record them
            if pr_types:
                exercise = Exercise.query.get(exercise_id)
                prs_achieved.append({
                    'exercise_id': exercise_id,
                    'exercise_name': exercise.name if exercise else 'Unknown',
                    'pr_types': pr_types,
                    'weight': current_weight,
                    'reps': current_reps,
                    'volume': current_volume,
                    'estimated_1rm': current_1rm
                })
        
        db.session.commit()
        return prs_achieved
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error checking PRs: {e}")
        return []


def get_user_prs(user_id, exercise_id=None):
    """Get all PRs for a user, optionally filtered by exercise."""
    query = PersonalRecord.query.filter_by(user_id=user_id)
    
    if exercise_id:
        query = query.filter_by(exercise_id=exercise_id)
    
    prs = query.all()
    
    result = []
    for pr in prs:
        exercise = Exercise.query.get(pr.exercise_id)
        result.append({
            'exercise_id': pr.exercise_id,
            'exercise_name': exercise.name if exercise else 'Unknown',
            'max_weight': float(pr.max_weight) if pr.max_weight else None,
            'max_reps': pr.max_reps,
            'max_volume': float(pr.max_volume) if pr.max_volume else None,
            'best_one_rep_max': float(pr.best_one_rep_max) if pr.best_one_rep_max else None,
            'achieved_at': pr.achieved_at.isoformat() if pr.achieved_at else None
        })
    
    return result
