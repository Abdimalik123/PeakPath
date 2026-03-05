from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models.user_point import UserPoint
from models import User
from api.auth import login_required
from datetime import datetime, timedelta
from sqlalchemy import desc

leaderboard_bp = Blueprint('leaderboard_bp', __name__)


@leaderboard_bp.route('/leaderboard', methods=['GET'])
@login_required
def get_leaderboard():
    """Get leaderboard with time filter and category support"""
    try:
        time_filter = request.args.get('filter', 'all-time')  # all-time, weekly, monthly
        category = request.args.get('category', 'points')  # points, volume, consistency, streak
        limit = int(request.args.get('limit', 100))
        
        # Calculate date range based on filter
        now = datetime.utcnow()
        if time_filter == 'weekly':
            start_date = now - timedelta(days=7)
        elif time_filter == 'monthly':
            start_date = now - timedelta(days=30)
        else:
            start_date = None
        
        if start_date:
            # For time-filtered leaderboards, calculate points from transactions
            from models.point_transaction import PointTransaction
            
            # Get users with points in the time range
            transactions = db.session.query(
                PointTransaction.user_id,
                db.func.sum(PointTransaction.points).label('total_points')
            ).filter(
                PointTransaction.created_at >= start_date
            ).group_by(
                PointTransaction.user_id
            ).order_by(
                desc('total_points')
            ).limit(limit).all()
            
            leaderboard = []
            for rank, (user_id, points) in enumerate(transactions, 1):
                user = User.query.get(user_id)
                if user:
                    user_points = UserPoint.query.filter_by(user_id=user_id).first()
                    leaderboard.append({
                        'rank': rank,
                        'user_id': user.id,
                        'username': user.username,
                        'profile_picture': user.profile_picture,
                        'points': int(points),
                        'level': user_points.level if user_points else 1,
                        'is_current_user': user.id == g.user['id']
                    })
        else:
            # All-time leaderboard from UserPoint
            user_points = UserPoint.query.order_by(
                desc(UserPoint.total_points)
            ).limit(limit).all()
            
            leaderboard = []
            for rank, up in enumerate(user_points, 1):
                user = User.query.get(up.user_id)
                if user:
                    leaderboard.append({
                        'rank': rank,
                        'user_id': user.id,
                        'username': user.username,
                        'profile_picture': user.profile_picture,
                        'points': up.total_points,
                        'level': up.level,
                        'is_current_user': user.id == g.user['id']
                    })
        
        # Find current user's rank if not in top results
        current_user_rank = None
        for entry in leaderboard:
            if entry['is_current_user']:
                current_user_rank = entry['rank']
                break
        
        if not current_user_rank:
            # Calculate user's rank
            if start_date:
                from models.point_transaction import PointTransaction
                user_points_in_range = db.session.query(
                    db.func.sum(PointTransaction.points)
                ).filter(
                    PointTransaction.user_id == g.user['id'],
                    PointTransaction.created_at >= start_date
                ).scalar() or 0
                
                higher_ranked = db.session.query(
                    db.func.count(db.func.distinct(PointTransaction.user_id))
                ).filter(
                    PointTransaction.created_at >= start_date
                ).group_by(
                    PointTransaction.user_id
                ).having(
                    db.func.sum(PointTransaction.points) > user_points_in_range
                ).count()
                
                current_user_rank = higher_ranked + 1
            else:
                user_points = UserPoint.query.filter_by(user_id=g.user['id']).first()
                if user_points:
                    higher_ranked = UserPoint.query.filter(
                        UserPoint.total_points > user_points.total_points
                    ).count()
                    current_user_rank = higher_ranked + 1
        
        return jsonify({
            'success': True,
            'leaderboard': leaderboard,
            'filter': time_filter,
            'current_user_rank': current_user_rank,
            'total_users': len(leaderboard)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching leaderboard: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch leaderboard'}), 500
