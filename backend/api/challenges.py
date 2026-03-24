from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models.challenge import Challenge, ChallengeParticipant
from models import User, Workout, WorkoutExercise
from api.auth import login_required
from datetime import datetime, timedelta
from sqlalchemy import and_, or_, func
from utils.validators import validate_request, ChallengeSchema

challenges_bp = Blueprint('challenges_bp', __name__)


@challenges_bp.route('/challenges', methods=['GET'])
@login_required
def get_challenges():
    """Get all active challenges (user's challenges + public challenges)"""
    try:
        user_id = g.user['id']
        
        # Get challenges user is participating in or created
        user_challenges = Challenge.query.join(
            ChallengeParticipant,
            Challenge.id == ChallengeParticipant.challenge_id
        ).filter(
            or_(
                ChallengeParticipant.user_id == user_id,
                Challenge.creator_id == user_id
            ),
            Challenge.status == 'active'
        ).distinct().all()
        
        # Get public challenges user hasn't joined
        public_challenges = Challenge.query.filter(
            Challenge.is_public == True,
            Challenge.status == 'active',
            Challenge.end_date > datetime.utcnow(),
            ~Challenge.participants.any(ChallengeParticipant.user_id == user_id)
        ).all()
        
        result = {
            'my_challenges': [c.to_dict() for c in user_challenges],
            'public_challenges': [c.to_dict() for c in public_challenges]
        }
        
        return jsonify({'success': True, **result}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching challenges: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch challenges'}), 500


@challenges_bp.route('/challenges', methods=['POST'])
@login_required
@validate_request(ChallengeSchema)
def create_challenge():
    """Create a new challenge"""
    try:
        data = request.validated_data
        user_id = g.user['id']

        start_date = datetime.utcnow()
        end_date = start_date + timedelta(days=data['duration_days'])

        challenge = Challenge(
            creator_id=user_id,
            challenge_type=data['challenge_type'],
            title=data['title'],
            description=data.get('description', ''),
            target_value=data['target_value'],
            target_exercise_id=data.get('target_exercise_id'),
            start_date=start_date,
            end_date=end_date,
            is_public=data.get('is_public', False),
            status='active'
        )

        db.session.add(challenge)
        db.session.flush()

        participant = ChallengeParticipant(
            challenge_id=challenge.id,
            user_id=user_id,
            current_progress=0,
            status='active'
        )
        db.session.add(participant)

        for invited_id in data.get('invited_users', []):
            if invited_id != user_id:
                invite = ChallengeParticipant(
                    challenge_id=challenge.id,
                    user_id=invited_id,
                    current_progress=0,
                    status='active'
                )
                db.session.add(invite)

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Challenge created successfully',
            'challenge': challenge.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating challenge: {e}")
        return jsonify({'success': False, 'message': 'Failed to create challenge'}), 500


@challenges_bp.route('/challenges/<int:challenge_id>/join', methods=['POST'])
@login_required
def join_challenge(challenge_id):
    """Join a challenge"""
    try:
        user_id = g.user['id']
        
        challenge = Challenge.query.get(challenge_id)
        if not challenge:
            return jsonify({'success': False, 'message': 'Challenge not found'}), 404
        
        if challenge.status != 'active':
            return jsonify({'success': False, 'message': 'Challenge is not active'}), 400
        
        # Check if already participating
        existing = ChallengeParticipant.query.filter_by(
            challenge_id=challenge_id,
            user_id=user_id
        ).first()
        
        if existing:
            return jsonify({'success': False, 'message': 'Already participating in this challenge'}), 400
        
        participant = ChallengeParticipant(
            challenge_id=challenge_id,
            user_id=user_id,
            current_progress=0,
            status='active'
        )
        
        db.session.add(participant)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Joined challenge successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error joining challenge: {e}")
        return jsonify({'success': False, 'message': 'Failed to join challenge'}), 500


@challenges_bp.route('/challenges/<int:challenge_id>', methods=['GET'])
@login_required
def get_challenge_details(challenge_id):
    """Get challenge details with leaderboard"""
    try:
        challenge = Challenge.query.get(challenge_id)
        if not challenge:
            return jsonify({'success': False, 'message': 'Challenge not found'}), 404
        
        # Get all participants with user details
        participants = db.session.query(
            ChallengeParticipant,
            User.username,
            User.profile_picture
        ).join(
            User, ChallengeParticipant.user_id == User.id
        ).filter(
            ChallengeParticipant.challenge_id == challenge_id
        ).order_by(
            ChallengeParticipant.current_progress.desc()
        ).all()
        
        leaderboard = []
        for participant, username, profile_pic in participants:
            leaderboard.append({
                'user_id': participant.user_id,
                'username': username,
                'profile_picture': profile_pic,
                'progress': participant.current_progress,
                'status': participant.status,
                'percentage': (participant.current_progress / challenge.target_value * 100) if challenge.target_value > 0 else 0
            })
        
        result = challenge.to_dict()
        result['leaderboard'] = leaderboard
        
        return jsonify({'success': True, 'challenge': result}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching challenge details: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch challenge details'}), 500


@challenges_bp.route('/challenges/<int:challenge_id>/update-progress', methods=['POST'])
@login_required
def update_challenge_progress(challenge_id):
    """Update user's progress in a challenge (called automatically after workouts)"""
    try:
        user_id = g.user['id']
        
        participant = ChallengeParticipant.query.filter_by(
            challenge_id=challenge_id,
            user_id=user_id
        ).first()
        
        if not participant:
            return jsonify({'success': False, 'message': 'Not participating in this challenge'}), 404
        
        challenge = Challenge.query.get(challenge_id)
        if not challenge:
            return jsonify({'success': False, 'message': 'Challenge not found'}), 404
        
        # Calculate progress based on challenge type
        progress = calculate_challenge_progress(user_id, challenge)
        participant.current_progress = progress
        
        # Check if completed
        if progress >= challenge.target_value and participant.status == 'active':
            participant.status = 'completed'
            participant.completed_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'progress': progress,
            'completed': participant.status == 'completed'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating challenge progress: {e}")
        return jsonify({'success': False, 'message': 'Failed to update progress'}), 500


def calculate_challenge_progress(user_id, challenge):
    """Calculate user's progress for a challenge"""
    start_date = challenge.start_date
    end_date = challenge.end_date
    
    if challenge.challenge_type == 'workout_count':
        # Count workouts in date range
        count = Workout.query.filter(
            Workout.user_id == user_id,
            Workout.date >= start_date.date(),
            Workout.date <= end_date.date()
        ).count()
        return count
    
    elif challenge.challenge_type == 'total_volume':
        # Sum total volume lifted
        workouts = Workout.query.filter(
            Workout.user_id == user_id,
            Workout.date >= start_date.date(),
            Workout.date <= end_date.date()
        ).all()
        
        total_volume = 0
        for workout in workouts:
            exercises = WorkoutExercise.query.filter_by(workout_id=workout.id).all()
            for ex in exercises:
                if ex.weight and ex.reps and ex.sets:
                    total_volume += ex.weight * ex.reps * ex.sets
        return total_volume
    
    elif challenge.challenge_type == 'specific_exercise':
        # Max weight for specific exercise
        if not challenge.target_exercise_id:
            return 0
        
        workouts = Workout.query.filter(
            Workout.user_id == user_id,
            Workout.date >= start_date.date(),
            Workout.date <= end_date.date()
        ).all()
        
        max_weight = 0
        for workout in workouts:
            exercises = WorkoutExercise.query.filter_by(
                workout_id=workout.id,
                exercise_id=challenge.target_exercise_id
            ).all()
            for ex in exercises:
                if ex.weight and ex.weight > max_weight:
                    max_weight = ex.weight
        return max_weight
    
    elif challenge.challenge_type == 'streak':
        # Workout streak days
        workouts = Workout.query.filter(
            Workout.user_id == user_id,
            Workout.date >= start_date.date(),
            Workout.date <= end_date.date()
        ).order_by(Workout.date.desc()).all()
        
        if not workouts:
            return 0
        
        streak = 1
        last_date = workouts[0].date
        
        for workout in workouts[1:]:
            if (last_date - workout.date).days == 1:
                streak += 1
                last_date = workout.date
            else:
                break
        
        return streak
    
    return 0
