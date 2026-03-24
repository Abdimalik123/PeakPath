from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models import User, Friendship, SocialActivity, ActivityLike, ActivityComment, UserPoint, Workout, WorkoutExercise, Exercise, Goal, Habit
from api.auth import login_required
from utils.logging import log_activity
from utils.validators import validate_request, CommentSchema
from sqlalchemy import or_, and_, desc
from datetime import datetime, timedelta, timezone

social_bp = Blueprint('social', __name__)


def _get_workout_details(workout_id):
    """Fetch full workout data including exercises for the feed."""
    try:
        workout = Workout.query.get(workout_id)
        if not workout:
            return None
        exercises = []
        for we in workout.exercises:
            exercise = Exercise.query.get(we.exercise_id)
            if exercise:
                exercises.append({
                    'name': exercise.name,
                    'sets': we.sets,
                    'reps': we.reps,
                    'weight': float(we.weight) if we.weight else None,
                    'duration': we.duration,
                    'notes': we.notes,
                })
        return {
            'type': workout.type,
            'duration': workout.duration,
            'date': workout.date.isoformat() if workout.date else None,
            'notes': workout.notes,
            'exercises': exercises,
        }
    except Exception:
        return None


@social_bp.route('/social/feed', methods=['GET'])
@login_required
def get_activity_feed():
    """Get activity feed from accepted friends and self only with reactions"""
    try:
        from models.activity_reaction import ActivityReaction
        user_id = g.user['id']

        friends = db.session.query(Friendship.friend_id).filter(
            Friendship.user_id == user_id,
            Friendship.status == 'accepted'
        ).all()
        friend_ids = [f[0] for f in friends]

        reverse_friends = db.session.query(Friendship.user_id).filter(
            Friendship.friend_id == user_id,
            Friendship.status == 'accepted'
        ).all()
        friend_ids.extend([f[0] for f in reverse_friends])
        friend_ids.append(user_id)
        friend_ids = list(set(friend_ids))

        activities = SocialActivity.query.filter(
            SocialActivity.user_id.in_(friend_ids)
        ).order_by(desc(SocialActivity.created_at)).limit(50).all()

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
            if not user:
                continue
            user_points = UserPoint.query.filter_by(user_id=activity.user_id).first()

            entry = {
                'id': activity.id,
                'user': {
                    'id': user.id,
                    'name': f"{user.firstname or ''} {user.lastname or ''}".strip() or user.email.split('@')[0],
                    'level': user_points.level if user_points else 1,
                    'points': user_points.total_points if user_points else 0,
                },
                'type': activity.activity_type,
                'action': activity.action,
                'details': activity.details,
                'timestamp': _format_timestamp(activity.created_at),
                'likes': activity.likes_count,
                'comments': activity.comments_count,
                'isLiked': activity.id in liked_activity_ids,
                'workout': None,
            }

            # Attach full workout data when available
            if activity.activity_type == 'workout' and activity.reference_id:
                entry['workout'] = _get_workout_details(activity.reference_id)

            # Add reactions data
            reactions = ActivityReaction.query.filter_by(activity_id=activity.id).all()
            reaction_summary = {}
            user_reactions = []
            
            for r in reactions:
                if r.reaction_type not in reaction_summary:
                    reaction_summary[r.reaction_type] = 0
                reaction_summary[r.reaction_type] += 1
                
                if r.user_id == user_id:
                    user_reactions.append(r.reaction_type)
            
            entry['reactions'] = reaction_summary
            entry['user_reactions'] = user_reactions

            result.append(entry)

        return jsonify({'success': True, 'activities': result}), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching activity feed: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch activity feed'}), 500


@social_bp.route('/social/leaderboard', methods=['GET'])
@login_required
def get_leaderboard():
    try:
        from models import PointTransaction
        from sqlalchemy import func
        user_id = g.user['id']
        time_range = request.args.get('range', 'week')

        if time_range == 'week':
            since = datetime.now(timezone.utc) - timedelta(days=7)
        elif time_range == 'month':
            since = datetime.now(timezone.utc) - timedelta(days=30)
        else:
            since = None

        if since is not None:
            points_subq = db.session.query(
                PointTransaction.user_id,
                func.coalesce(func.sum(PointTransaction.points), 0).label('period_points')
            ).filter(PointTransaction.created_at >= since).group_by(PointTransaction.user_id).subquery()

            rows = db.session.query(
                User.id, User.firstname, User.lastname, User.email,
                func.coalesce(points_subq.c.period_points, 0).label('pts'),
                UserPoint.level
            ).outerjoin(points_subq, User.id == points_subq.c.user_id)\
             .outerjoin(UserPoint, User.id == UserPoint.user_id)\
             .order_by(desc('pts')).limit(100).all()
        else:
            rows = db.session.query(
                User.id, User.firstname, User.lastname, User.email,
                func.coalesce(UserPoint.total_points, 0).label('pts'),
                UserPoint.level
            ).outerjoin(UserPoint, User.id == UserPoint.user_id)\
             .order_by(desc('pts')).limit(100).all()

        leaderboard = []
        current_user_data = None
        for rank, u in enumerate(rows, start=1):
            entry = {
                'id': u[0],
                'name': f"{u[1] or ''} {u[2] or ''}".strip() or u[3].split('@')[0],
                'level': u[5] or 1,
                'points': int(u[4] or 0),
                'rank': rank,
                'streak': 0,
            }
            leaderboard.append(entry)
            if u[0] == user_id:
                current_user_data = entry

        return jsonify({'success': True, 'leaderboard': leaderboard, 'current_user': current_user_data}), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching leaderboard: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@social_bp.route('/social/users/search', methods=['GET'])
@login_required
def search_users():
    """Search for users by name or email"""
    try:
        user_id = g.user['id']
        query = request.args.get('q', '').strip()
        
        if not query or len(query) < 2:
            return jsonify({'success': False, 'message': 'Query must be at least 2 characters'}), 400
        
        # Search by name or email (case-insensitive)
        search_pattern = f"%{query}%"
        users = User.query.filter(
            User.id != user_id,  # Exclude self
            or_(
                User.firstname.ilike(search_pattern),
                User.lastname.ilike(search_pattern),
                User.email.ilike(search_pattern)
            )
        ).limit(20).all()
        
        # Get existing friendships to show status
        existing_friendships = {}
        if users:
            user_ids = [u.id for u in users]
            friendships = Friendship.query.filter(
                or_(
                    and_(Friendship.user_id == user_id, Friendship.friend_id.in_(user_ids)),
                    and_(Friendship.friend_id == user_id, Friendship.user_id.in_(user_ids))
                )
            ).all()
            
            for f in friendships:
                other_id = f.friend_id if f.user_id == user_id else f.user_id
                existing_friendships[other_id] = f.status
        
        results = []
        for user in users:
            up = UserPoint.query.filter_by(user_id=user.id).first()
            results.append({
                'id': user.id,
                'name': f"{user.firstname or ''} {user.lastname or ''}".strip() or user.email.split('@')[0],
                'email': user.email,
                'level': up.level if up else 1,
                'points': up.total_points if up else 0,
                'friendship_status': existing_friendships.get(user.id, None),
            })
        
        return jsonify({'success': True, 'users': results}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error searching users: {e}")
        return jsonify({'success': False, 'message': 'Failed to search users'}), 500


@social_bp.route('/social/friends', methods=['GET'])
@login_required
def get_friends():
    try:
        user_id = g.user['id']
        f1 = db.session.query(Friendship).filter(Friendship.user_id == user_id, Friendship.status == 'accepted').all()
        f2 = db.session.query(Friendship).filter(Friendship.friend_id == user_id, Friendship.status == 'accepted').all()
        friend_ids = [f.friend_id for f in f1] + [f.user_id for f in f2]

        friends = []
        for fid in friend_ids:
            user = User.query.get(fid)
            up = UserPoint.query.filter_by(user_id=fid).first()
            friends.append({
                'id': user.id,
                'name': f"{user.firstname or ''} {user.lastname or ''}".strip() or user.email.split('@')[0],
                'level': up.level if up else 1,
                'points': up.total_points if up else 0,
                'isFollowing': True,
                'streak': 0,
            })
        return jsonify({'success': True, 'friends': friends}), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching friends: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch friends'}), 500


@social_bp.route('/social/friend-requests', methods=['GET'])
@login_required
def get_friend_requests():
    try:
        user_id = g.user['id']
        pending = db.session.query(Friendship).filter(
            Friendship.friend_id == user_id, Friendship.status == 'pending'
        ).all()

        requests = []
        for f in pending:
            sender = User.query.get(f.user_id)
            if not sender:
                continue
            up = UserPoint.query.filter_by(user_id=f.user_id).first()
            requests.append({
                'friendship_id': f.id,
                'id': sender.id,
                'name': f"{sender.firstname or ''} {sender.lastname or ''}".strip() or sender.email.split('@')[0],
                'level': up.level if up else 1,
                'points': up.total_points if up else 0,
            })
        return jsonify({'success': True, 'requests': requests}), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching friend requests: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch friend requests'}), 500


@social_bp.route('/social/friend-requests/<int:friendship_id>/accept', methods=['POST'])
@login_required
def accept_friend_request(friendship_id):
    try:
        user_id = g.user['id']
        friendship = Friendship.query.filter_by(id=friendship_id, friend_id=user_id, status='pending').first()
        if not friendship:
            return jsonify({'success': False, 'message': 'Friend request not found'}), 404

        friendship.status = 'accepted'
        friendship.updated_at = datetime.now(timezone.utc)

        # Notify the sender that their request was accepted
        from utils.notifications import notify_friend_accepted
        accepter = User.query.get(user_id)
        accepter_name = f"{accepter.firstname or ''} {accepter.lastname or ''}".strip() or accepter.email.split('@')[0]
        notify_friend_accepted(friendship.user_id, accepter_name)

        db.session.commit()
        log_activity(user_id, "accepted", "friend_request", friendship.user_id)
        return jsonify({'success': True, 'message': 'Friend request accepted'}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error accepting friend request: {e}")
        return jsonify({'success': False, 'message': 'Failed to accept request'}), 500


@social_bp.route('/social/friend-requests/<int:friendship_id>/decline', methods=['POST'])
@login_required
def decline_friend_request(friendship_id):
    try:
        user_id = g.user['id']
        friendship = Friendship.query.filter_by(id=friendship_id, friend_id=user_id, status='pending').first()
        if not friendship:
            return jsonify({'success': False, 'message': 'Friend request not found'}), 404
        db.session.delete(friendship)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Friend request declined'}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error declining friend request: {e}")
        return jsonify({'success': False, 'message': 'Failed to decline request'}), 500


@social_bp.route('/social/suggestions', methods=['GET'])
@login_required
def get_friend_suggestions():
    try:
        user_id = g.user['id']
        existing_as_user = db.session.query(Friendship.friend_id).filter(Friendship.user_id == user_id).all()
        existing_as_friend = db.session.query(Friendship.user_id).filter(Friendship.friend_id == user_id).all()
        excluded = [f[0] for f in existing_as_user] + [f[0] for f in existing_as_friend]
        excluded.append(user_id)

        suggestions_query = db.session.query(
            User.id, User.firstname, User.lastname, User.email,
            UserPoint.total_points, UserPoint.level
        ).join(UserPoint, User.id == UserPoint.user_id, isouter=True).filter(
            ~User.id.in_(excluded)
        ).order_by(desc(UserPoint.total_points)).limit(10)

        suggestions = []
        for u in suggestions_query.all():
            suggestions.append({
                'id': u[0],
                'name': f"{u[1] or ''} {u[2] or ''}".strip() or u[3].split('@')[0],
                'level': u[5] or 1,
                'points': u[4] or 0,
                'isFollowing': False,
            })
        return jsonify({'success': True, 'suggestions': suggestions}), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching suggestions: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch suggestions'}), 500


@social_bp.route('/social/friends/<int:friend_id>', methods=['POST'])
@login_required
def add_friend(friend_id):
    try:
        user_id = g.user['id']
        if user_id == friend_id:
            return jsonify({'success': False, 'message': 'Cannot add yourself as friend'}), 400

        friend = User.query.get(friend_id)
        if not friend:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        existing = Friendship.query.filter(
            or_(
                and_(Friendship.user_id == user_id, Friendship.friend_id == friend_id),
                and_(Friendship.user_id == friend_id, Friendship.friend_id == user_id)
            )
        ).first()

        if existing:
            if existing.status == 'accepted':
                return jsonify({'success': False, 'message': 'Already friends'}), 400
            if existing.status == 'pending':
                if existing.user_id == friend_id:
                    # They already sent us a request — auto-accept
                    existing.status = 'accepted'
                    existing.updated_at = datetime.now(timezone.utc)
                    db.session.commit()
                    return jsonify({'success': True, 'message': 'Friend request accepted'}), 200
                else:
                    return jsonify({'success': False, 'message': 'Friend request already sent'}), 400

        friendship = Friendship(user_id=user_id, friend_id=friend_id, status='pending')
        db.session.add(friendship)

        # Notify the recipient
        from utils.notifications import notify_friend_request
        sender = User.query.get(user_id)
        sender_name = f"{sender.firstname or ''} {sender.lastname or ''}".strip() or sender.email.split('@')[0]
        notify_friend_request(friend_id, sender_name)

        db.session.commit()
        log_activity(user_id, "sent_request", "friend", friend_id)
        return jsonify({'success': True, 'message': 'Friend request sent'}), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error sending friend request: {e}")
        return jsonify({'success': False, 'message': 'Failed to send friend request'}), 500


@social_bp.route('/social/friends/<int:friend_id>', methods=['DELETE'])
@login_required
def remove_friend(friend_id):
    try:
        user_id = g.user['id']
        friendship = Friendship.query.filter(
            or_(
                and_(Friendship.user_id == user_id, Friendship.friend_id == friend_id),
                and_(Friendship.user_id == friend_id, Friendship.friend_id == user_id)
            )
        ).first()
        if not friendship:
            return jsonify({'success': False, 'message': 'Friendship not found'}), 404
        db.session.delete(friendship)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Friend removed'}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error removing friend: {e}")
        return jsonify({'success': False, 'message': 'Failed to remove friend'}), 500


@social_bp.route('/social/activities/<int:activity_id>/like', methods=['POST'])
@login_required
def like_activity(activity_id):
    try:
        user_id = g.user['id']
        activity = SocialActivity.query.get(activity_id)
        if not activity:
            return jsonify({'success': False, 'message': 'Activity not found'}), 404

        existing_like = ActivityLike.query.filter_by(activity_id=activity_id, user_id=user_id).first()
        if existing_like:
            db.session.delete(existing_like)
            activity.likes_count = max(0, activity.likes_count - 1)
            action = 'unliked'
        else:
            db.session.add(ActivityLike(activity_id=activity_id, user_id=user_id))
            activity.likes_count += 1
            action = 'liked'

            # Notify activity owner (not yourself)
            if activity.user_id != user_id:
                from utils.notifications import notify_activity_liked
                liker = User.query.get(user_id)
                liker_name = f"{liker.firstname or ''} {liker.lastname or ''}".strip() or liker.email.split('@')[0]
                notify_activity_liked(activity.user_id, liker_name, activity.action)

        db.session.commit()
        return jsonify({'success': True, 'action': action, 'likes_count': activity.likes_count}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error liking activity: {e}")
        return jsonify({'success': False, 'message': 'Failed to like activity'}), 500


@social_bp.route('/social/activities/<int:activity_id>/comments', methods=['GET'])
@login_required
def get_comments(activity_id):
    try:
        activity = SocialActivity.query.get(activity_id)
        if not activity:
            return jsonify({'success': False, 'message': 'Activity not found'}), 404

        comments = ActivityComment.query.filter_by(activity_id=activity_id).order_by(ActivityComment.created_at.asc()).all()
        result = []
        for c in comments:
            user = User.query.get(c.user_id)
            if not user:
                continue
            result.append({
                'id': c.id,
                'user_id': c.user_id,
                'name': f"{user.firstname or ''} {user.lastname or ''}".strip() or user.email.split('@')[0],
                'comment': c.comment,
                'timestamp': _format_timestamp(c.created_at),
            })
        return jsonify({'success': True, 'comments': result}), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching comments: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch comments'}), 500


@social_bp.route('/social/activities/<int:activity_id>/comments', methods=['POST'])
@login_required
@validate_request(CommentSchema)
def add_comment(activity_id):
    try:
        user_id = g.user['id']
        data = request.validated_data

        activity = SocialActivity.query.get(activity_id)
        if not activity:
            return jsonify({'success': False, 'message': 'Activity not found'}), 404

        comment = ActivityComment(activity_id=activity_id, user_id=user_id, comment=data['comment'])
        db.session.add(comment)
        activity.comments_count += 1

        if activity.user_id != user_id:
            from utils.notifications import notify_activity_commented
            commenter = User.query.get(user_id)
            commenter_name = f"{commenter.firstname or ''} {commenter.lastname or ''}".strip() or commenter.email.split('@')[0]
            notify_activity_commented(activity.user_id, commenter_name, activity.action, data['comment'])

        db.session.commit()

        user = User.query.get(user_id)
        return jsonify({
            'success': True,
            'comments_count': activity.comments_count,
            'comment': {
                'id': comment.id,
                'user_id': user_id,
                'name': f"{user.firstname or ''} {user.lastname or ''}".strip() or user.email.split('@')[0],
                'comment': comment.comment,
                'timestamp': 'just now',
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding comment: {e}")
        return jsonify({'success': False, 'message': 'Failed to add comment'}), 500


def _format_timestamp(dt):
    now = datetime.now(timezone.utc)
    # Ensure dt is timezone-aware to avoid subtraction error
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = now - dt
    if diff.days > 365:
        return f"{diff.days // 365} year{'s' if diff.days // 365 > 1 else ''} ago"
    elif diff.days > 30:
        return f"{diff.days // 30} month{'s' if diff.days // 30 > 1 else ''} ago"
    elif diff.days > 0:
        return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
    elif diff.seconds > 3600:
        h = diff.seconds // 3600
        return f"{h} hour{'s' if h > 1 else ''} ago"
    elif diff.seconds > 60:
        m = diff.seconds // 60
        return f"{m} minute{'s' if m > 1 else ''} ago"
    else:
        return "just now"