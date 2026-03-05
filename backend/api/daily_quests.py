from flask import Blueprint, jsonify, g, current_app
from database import db
from models.daily_quest import DailyQuest, UserDailyQuest
from api.auth import login_required
from datetime import date, datetime
from utils.gamification_helper import award_points

daily_quests_bp = Blueprint('daily_quests_bp', __name__)


@daily_quests_bp.route('/daily-quests', methods=['GET'])
@login_required
def get_daily_quests():
    """Get today's daily quests for the user"""
    try:
        user_id = g.user['id']
        today = date.today()
        
        # Check if user has quests assigned for today
        user_quests = UserDailyQuest.query.filter_by(
            user_id=user_id,
            date_assigned=today
        ).all()
        
        # If no quests for today, assign new ones
        if not user_quests:
            user_quests = assign_daily_quests(user_id, today)
        
        result = [uq.to_dict() for uq in user_quests]
        
        return jsonify({
            'success': True,
            'quests': result,
            'date': today.isoformat()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching daily quests: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch daily quests'}), 500


@daily_quests_bp.route('/daily-quests/<int:quest_id>/complete', methods=['POST'])
@login_required
def complete_quest(quest_id):
    """Mark a quest as completed and award points"""
    try:
        user_id = g.user['id']
        
        user_quest = UserDailyQuest.query.filter_by(
            id=quest_id,
            user_id=user_id
        ).first()
        
        if not user_quest:
            return jsonify({'success': False, 'message': 'Quest not found'}), 404
        
        if user_quest.is_completed:
            return jsonify({'success': False, 'message': 'Quest already completed'}), 400
        
        # Mark as completed
        user_quest.is_completed = True
        user_quest.completed_at = datetime.utcnow()
        user_quest.current_progress = user_quest.quest.target_value
        
        # Award points
        points_awarded = award_points(
            user_id=user_id,
            reason='daily_quest_completed',
            points=user_quest.quest.points_reward,
            entity_type='quest',
            entity_id=quest_id
        )
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Quest completed!',
            'points_awarded': points_awarded['points_earned'] if points_awarded else 0
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error completing quest: {e}")
        return jsonify({'success': False, 'message': 'Failed to complete quest'}), 500


def assign_daily_quests(user_id, quest_date):
    """Assign 3 random daily quests to a user"""
    # Get all active quests
    all_quests = DailyQuest.query.filter_by(is_active=True).all()
    
    if not all_quests:
        # Create default quests if none exist
        create_default_quests()
        all_quests = DailyQuest.query.filter_by(is_active=True).all()
    
    # Select 3 random quests
    import random
    selected_quests = random.sample(all_quests, min(3, len(all_quests)))
    
    user_quests = []
    for quest in selected_quests:
        user_quest = UserDailyQuest(
            user_id=user_id,
            quest_id=quest.id,
            date_assigned=quest_date,
            current_progress=0,
            is_completed=False
        )
        db.session.add(user_quest)
        user_quests.append(user_quest)
    
    db.session.flush()
    return user_quests


def create_default_quests():
    """Create default daily quests"""
    default_quests = [
        {
            'quest_type': 'log_workout',
            'title': 'Log a Workout',
            'description': 'Complete and log any workout',
            'points_reward': 50,
            'target_value': 1,
            'icon': '💪'
        },
        {
            'quest_type': 'complete_habit',
            'title': 'Complete a Habit',
            'description': 'Mark any habit as complete',
            'points_reward': 25,
            'target_value': 1,
            'icon': '✅'
        },
        {
            'quest_type': 'comment_on_friend',
            'title': 'Engage with Friends',
            'description': 'Comment on a friend\'s workout',
            'points_reward': 15,
            'target_value': 1,
            'icon': '💬'
        },
        {
            'quest_type': 'hit_pr',
            'title': 'Hit a New PR',
            'description': 'Achieve a personal record',
            'points_reward': 100,
            'target_value': 1,
            'icon': '🏆'
        },
        {
            'quest_type': 'log_weight',
            'title': 'Track Your Weight',
            'description': 'Log your weight for today',
            'points_reward': 10,
            'target_value': 1,
            'icon': '⚖️'
        },
        {
            'quest_type': 'workout_streak',
            'title': 'Maintain Your Streak',
            'description': 'Keep your workout streak alive',
            'points_reward': 30,
            'target_value': 1,
            'icon': '🔥'
        }
    ]
    
    for quest_data in default_quests:
        quest = DailyQuest(**quest_data)
        db.session.add(quest)
    
    db.session.flush()


def update_quest_progress(user_id, quest_type, increment=1):
    """Update progress for a specific quest type"""
    today = date.today()
    
    user_quest = UserDailyQuest.query.join(DailyQuest).filter(
        UserDailyQuest.user_id == user_id,
        UserDailyQuest.date_assigned == today,
        DailyQuest.quest_type == quest_type,
        UserDailyQuest.is_completed == False
    ).first()
    
    if user_quest:
        user_quest.current_progress += increment
        
        # Auto-complete if target reached
        if user_quest.current_progress >= user_quest.quest.target_value:
            user_quest.is_completed = True
            user_quest.completed_at = datetime.utcnow()
            
            # Award points
            award_points(
                user_id=user_id,
                reason='daily_quest_completed',
                points=user_quest.quest.points_reward,
                entity_type='quest',
                entity_id=user_quest.id
            )
        
        db.session.flush()
        return True
    
    return False
