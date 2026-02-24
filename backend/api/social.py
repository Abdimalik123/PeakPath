from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models import User, Friendship, SocialActivity, ActivityLike, ActivityComment, UserPoint, Workout, Goal, Habit
from api.auth import login_required
from utils.logging import log_activity
from sqlalchemy import or_, and_, desc
from datetime import datetime, timedelta

social_bp = Blueprint('social', __name__)


@social_bp.route('/social/feed', methods=['GET'])
@login_required
def get_activity_feed():
    """Get activity feed from friends and self"""
    try:
        user_id = g.user['id']
        
        # Get list of friend IDs
        friends = db.session.query(Friendship.friend_id).filter(
            Friendship.user_id == user_id,
            Friendship.status == 'accepted'
        ).all()
        friend_ids = [f[0] for f in friends]
        
        # Also get reverse friendships
        reverse_friends = db.session.query(Friendship.user_id).filter(
            Friendship.friend_id == user_id,
            Friendship.status == 'accepted'
        ).all()
        friend_ids.extend([f[0] for f in reverse_friends])
        
        # Include self in feed
        friend_ids.append(user_id)
        friend_ids = list(set(friend_ids))
        
        # Get activities from friends and self
        activities = SocialActivity.query.filter(
            SocialActivity.user_id.in_(friend_ids)
        ).order_by(desc(SocialActivity.created_at)).limit(50).all()
        
        # Check which activities current user has liked
        liked_activity_ids = set()
        if activities:
            activity_ids = [a.id for a in activities]
            likes = ActivityLike.query.filter(
                ActivityLike.activity_id.in_(activity_ids),
                ActivityLike.user_id == user_id
            ).all()
            liked_activity_ids = {like.activity_id for like in likes}
        
        result = []
        for activity in activities:
            user = User.query.get(activity.user_id)
            user_points = UserPoint.query.filter_by(user_id=activity.user_id).first()
            
            result.append({
                'id': activity.id,
                'user': {
                    'id': user.id,
                    'name': f"{user.firstname or ''} {user.lastname or ''}".strip() or user.email.split('@')[0],
                    'level': user_points.level if user_points else 1,
                    'points': user_points.total_points if user_points else 0
                },
                'type': activity.activity_type,
                'action': activity.action,
                'details': activity.details,
                'timestamp': _format_timestamp(activity.created_at),
                'likes': activity.likes_count,
                'comments': activity.comments_count,
                'isLiked': activity.id in liked_activity_ids
            })
        
        return jsonify({
            'success': True,
            'activities': result
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching activity feed: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch activity feed'
        }), 500


@social_bp.route('/social/leaderboard', methods=['GET'])
@login_required
def get_leaderboard():
    """Get leaderboard rankings"""
    try:
        print("=== LEADERBOARD ENDPOINT CALLED ===")
        time_range = request.args.get('range', 'week')
        print(f"Time range: {time_range}")
        
        # Calculate date filter based on range
        now = datetime.utcnow()
        if time_range == 'week':
            start_date = now - timedelta(days=7)
        elif time_range == 'month':
            start_date = now - timedelta(days=30)
        else:  # all time
            start_date = None
        
        # Get all users with points (LEFT JOIN so users without points still appear)
        print("Building query...")
        query = db.session.query(
            User.id,
            User.firstname,
            User.lastname,
            User.email,
            UserPoint.total_points,
            UserPoint.level
        ).outerjoin(UserPoint, User.id == UserPoint.user_id)
        
        # Order by points descending (highest first), nulls last
        query = query.order_by(UserPoint.total_points.desc().nullslast())
        
        print("Executing query...")
        users = query.limit(100).all()
        print(f"Got {len(users)} users")
        
        leaderboard = []
        for rank, user_data in enumerate(users, start=1):
            leaderboard.append({
                'id': user_data[0],
                'name': f"{user_data[1] or ''} {user_data[2] or ''}".strip() or user_data[3].split('@')[0],
                'level': user_data[5] or 1,
                'points': user_data[4] or 0,
                'rank': rank,
                'streak': 0  # Streak not stored in UserPoint, default to 0
            })
        
        return jsonify({
            'success': True,
            'leaderboard': leaderboard
        }), 200
        
    except Exception as e:
        import traceback
        print("=== ERROR IN LEADERBOARD ===")
        print(f"Error: {e}")
        print(f"Error type: {type(e)}")
        print("Traceback:")
        print(traceback.format_exc())
        current_app.logger.error(f"Error fetching leaderboard: {e}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Failed to fetch leaderboard: {str(e)}'
        }), 500


@social_bp.route('/social/friends', methods=['GET'])
@login_required
def get_friends():
    """Get user's friends list"""
    try:
        user_id = g.user['id']
        
        # Get accepted friendships (both directions)
        friendships1 = db.session.query(Friendship).filter(
            Friendship.user_id == user_id,
            Friendship.status == 'accepted'
        ).all()
        
        friendships2 = db.session.query(Friendship).filter(
            Friendship.friend_id == user_id,
            Friendship.status == 'accepted'
        ).all()
        
        friend_ids = [f.friend_id for f in friendships1] + [f.user_id for f in friendships2]
        
        friends = []
        for friend_id in friend_ids:
            user = User.query.get(friend_id)
            user_points = UserPoint.query.filter_by(user_id=friend_id).first()
            
            friends.append({
                'id': user.id,
                'name': f"{user.firstname or ''} {user.lastname or ''}".strip() or user.email.split('@')[0],
                'level': user_points.level if user_points else 1,
                'points': user_points.total_points if user_points else 0,
                'isFollowing': True,
                'streak': 0
            })
        
        return jsonify({
            'success': True,
            'friends': friends
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching friends: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch friends'
        }), 500


@social_bp.route('/social/suggestions', methods=['GET'])
@login_required
def get_friend_suggestions():
    """Get friend suggestions"""
    try:
        user_id = g.user['id']
        
        # Get existing friend IDs (both directions of friendship)
        existing_friends_as_user = db.session.query(Friendship.friend_id).filter(
            Friendship.user_id == user_id
        ).all()
        existing_friends_as_friend = db.session.query(Friendship.user_id).filter(
            Friendship.friend_id == user_id
        ).all()
        
        existing_friend_ids = [f[0] for f in existing_friends_as_user] + [f[0] for f in existing_friends_as_friend]
        existing_friend_ids.append(user_id)  # Exclude self
        
        # Get users not in friend list
        suggestions_query = db.session.query(
            User.id,
            User.firstname,
            User.lastname,
            User.email,
            UserPoint.total_points,
            UserPoint.level
        ).join(UserPoint, User.id == UserPoint.user_id, isouter=True).filter(
            ~User.id.in_(existing_friend_ids)
        ).order_by(desc(UserPoint.total_points)).limit(10)
        
        suggestions = []
        for user_data in suggestions_query.all():
            suggestions.append({
                'id': user_data[0],
                'name': f"{user_data[1] or ''} {user_data[2] or ''}".strip() or user_data[3].split('@')[0],
                'level': user_data[5] or 1,
                'points': user_data[4] or 0,
                'isFollowing': False
            })
        
        return jsonify({
            'success': True,
            'suggestions': suggestions
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching suggestions: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch suggestions'
        }), 500


@social_bp.route('/social/friends/<int:friend_id>', methods=['POST'])
@login_required
def add_friend(friend_id):
    """Send friend request or accept existing request"""
    try:
        user_id = g.user['id']
        
        if user_id == friend_id:
            return jsonify({
                'success': False,
                'message': 'Cannot add yourself as friend'
            }), 400
        
        # Check if friend exists
        friend = User.query.get(friend_id)
        if not friend:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Check if friendship already exists
        existing = Friendship.query.filter(
            or_(
                and_(Friendship.user_id == user_id, Friendship.friend_id == friend_id),
                and_(Friendship.user_id == friend_id, Friendship.friend_id == user_id)
            )
        ).first()
        
        if existing:
            if existing.status == 'accepted':
                return jsonify({
                    'success': False,
                    'message': 'Already friends'
                }), 400
            elif existing.user_id == friend_id and existing.status == 'pending':
                # Accept incoming friend request
                existing.status = 'accepted'
                existing.updated_at = datetime.utcnow()
                db.session.commit()
                
                log_activity(user_id, "accepted", "friend_request", friend_id)
                
                return jsonify({
                    'success': True,
                    'message': 'Friend request accepted'
                }), 200
        
        # Create new friendship
        friendship = Friendship(
            user_id=user_id,
            friend_id=friend_id,
            status='accepted'  # Auto-accept for simplicity
        )
        db.session.add(friendship)
        db.session.commit()
        
        log_activity(user_id, "added", "friend", friend_id)
        
        return jsonify({
            'success': True,
            'message': 'Friend added successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding friend: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to add friend'
        }), 500


@social_bp.route('/social/friends/<int:friend_id>', methods=['DELETE'])
@login_required
def remove_friend(friend_id):
    """Remove friend"""
    try:
        user_id = g.user['id']
        
        friendship = Friendship.query.filter(
            or_(
                and_(Friendship.user_id == user_id, Friendship.friend_id == friend_id),
                and_(Friendship.user_id == friend_id, Friendship.friend_id == user_id)
            )
        ).first()
        
        if not friendship:
            return jsonify({
                'success': False,
                'message': 'Friendship not found'
            }), 404
        
        db.session.delete(friendship)
        db.session.commit()
        
        log_activity(user_id, "removed", "friend", friend_id)
        
        return jsonify({
            'success': True,
            'message': 'Friend removed successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error removing friend: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to remove friend'
        }), 500


@social_bp.route('/social/activities/<int:activity_id>/like', methods=['POST'])
@login_required
def like_activity(activity_id):
    """Like or unlike an activity"""
    try:
        user_id = g.user['id']
        
        activity = SocialActivity.query.get(activity_id)
        if not activity:
            return jsonify({
                'success': False,
                'message': 'Activity not found'
            }), 404
        
        # Check if already liked
        existing_like = ActivityLike.query.filter_by(
            activity_id=activity_id,
            user_id=user_id
        ).first()
        
        if existing_like:
            # Unlike
            db.session.delete(existing_like)
            activity.likes_count = max(0, activity.likes_count - 1)
            action = 'unliked'
        else:
            # Like
            like = ActivityLike(
                activity_id=activity_id,
                user_id=user_id
            )
            db.session.add(like)
            activity.likes_count += 1
            action = 'liked'
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'action': action,
            'likes_count': activity.likes_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error liking activity: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to like activity'
        }), 500


@social_bp.route('/social/activities/<int:activity_id>/comments', methods=['POST'])
@login_required
def add_comment(activity_id):
    """Add comment to activity"""
    try:
        user_id = g.user['id']
        data = request.get_json()
        
        if not data or not data.get('comment'):
            return jsonify({
                'success': False,
                'message': 'Comment text is required'
            }), 400
        
        activity = SocialActivity.query.get(activity_id)
        if not activity:
            return jsonify({
                'success': False,
                'message': 'Activity not found'
            }), 404
        
        comment = ActivityComment(
            activity_id=activity_id,
            user_id=user_id,
            comment=data['comment']
        )
        db.session.add(comment)
        activity.comments_count += 1
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Comment added successfully',
            'comments_count': activity.comments_count
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding comment: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to add comment'
        }), 500


def _format_timestamp(dt):
    """Format datetime to relative time string"""
    now = datetime.utcnow()
    diff = now - dt
    
    if diff.days > 365:
        years = diff.days // 365
        return f"{years} year{'s' if years > 1 else ''} ago"
    elif diff.days > 30:
        months = diff.days // 30
        return f"{months} month{'s' if months > 1 else ''} ago"
    elif diff.days > 0:
        return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    else:
        return "just now"
