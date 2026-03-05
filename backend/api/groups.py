from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models.group import Group, GroupMember, GroupPost
from models import User
from api.auth import login_required
from datetime import datetime

groups_bp = Blueprint('groups_bp', __name__)


@groups_bp.route('/groups', methods=['GET'])
@login_required
def get_groups():
    """Get all public groups or user's groups"""
    try:
        user_id = g.user['id']
        filter_type = request.args.get('filter', 'all')  # all, my-groups, public
        
        if filter_type == 'my-groups':
            # Get groups user is a member of
            user_groups = db.session.query(Group).join(
                GroupMember, Group.id == GroupMember.group_id
            ).filter(
                GroupMember.user_id == user_id
            ).all()
            groups = user_groups
        else:
            # Get all public groups
            groups = Group.query.filter_by(is_public=True).order_by(
                Group.member_count.desc()
            ).all()
        
        result = []
        for group in groups:
            group_dict = group.to_dict()
            # Check if user is a member
            is_member = GroupMember.query.filter_by(
                group_id=group.id,
                user_id=user_id
            ).first() is not None
            group_dict['is_member'] = is_member
            result.append(group_dict)
        
        return jsonify({
            'success': True,
            'groups': result
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching groups: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch groups'}), 500


@groups_bp.route('/groups', methods=['POST'])
@login_required
def create_group():
    """Create a new group"""
    try:
        data = request.get_json()
        user_id = g.user['id']
        
        if not data.get('name'):
            return jsonify({'success': False, 'message': 'Group name is required'}), 400
        
        group = Group(
            name=data['name'],
            description=data.get('description', ''),
            creator_id=user_id,
            is_public=data.get('is_public', True),
            category=data.get('category', 'General'),
            member_count=1
        )
        
        db.session.add(group)
        db.session.flush()
        
        # Auto-add creator as admin member
        member = GroupMember(
            group_id=group.id,
            user_id=user_id,
            role='admin'
        )
        db.session.add(member)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Group created successfully',
            'group': group.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating group: {e}")
        return jsonify({'success': False, 'message': 'Failed to create group'}), 500


@groups_bp.route('/groups/<int:group_id>', methods=['GET'])
@login_required
def get_group_details(group_id):
    """Get group details with posts and members"""
    user_id = g.user['id']
    
    try:
        group = Group.query.get(group_id)
        if not group:
            return jsonify({'success': False, 'message': 'Group not found'}), 404
        
        # Check if user is a member
        is_member = GroupMember.query.filter_by(
            group_id=group_id,
            user_id=user_id
        ).first() is not None
        
        # Get members with safe query
        members_query = db.session.query(GroupMember).filter(
            GroupMember.group_id == group_id
        ).all()
        
        members_list = []
        for member in members_query:
            user = User.query.get(member.user_id)
            if user:
                # Use email as username if no username field exists
                username = user.email.split('@')[0] if user.email else f"User{user.id}"
                members_list.append({
                    'user_id': member.user_id,
                    'username': username,
                    'profile_picture': None,  # No profile picture in current schema
                    'role': member.role,
                    'joined_at': member.joined_at.isoformat() if member.joined_at else None
                })
        
        # Get recent posts with safe query
        posts_query = GroupPost.query.filter_by(
            group_id=group_id
        ).order_by(
            GroupPost.created_at.desc()
        ).limit(50).all()
        
        posts_list = []
        for post in posts_query:
            user = User.query.get(post.user_id)
            if user:
                # Use email as username if no username field exists
                username = user.email.split('@')[0] if user.email else f"User{user.id}"
                posts_list.append({
                    'id': post.id,
                    'user_id': post.user_id,
                    'username': username,
                    'profile_picture': None,  # No profile picture in current schema
                    'content': post.content,
                    'created_at': post.created_at.isoformat() if post.created_at else None
                })
        
        group_dict = group.to_dict()
        group_dict['is_member'] = is_member
        group_dict['members'] = members_list
        group_dict['posts'] = posts_list
        
        return jsonify({
            'success': True,
            'group': group_dict
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching group details: {e}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': str(e)}), 500


@groups_bp.route('/groups/<int:group_id>/join', methods=['POST'])
@login_required
def join_group(group_id):
    """Join a group"""
    try:
        user_id = g.user['id']
        
        group = Group.query.get(group_id)
        if not group:
            return jsonify({'success': False, 'message': 'Group not found'}), 404
        
        # Check if already a member
        existing = GroupMember.query.filter_by(
            group_id=group_id,
            user_id=user_id
        ).first()
        
        if existing:
            return jsonify({'success': False, 'message': 'Already a member'}), 400
        
        member = GroupMember(
            group_id=group_id,
            user_id=user_id,
            role='member'
        )
        
        db.session.add(member)
        group.member_count += 1
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Joined group successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error joining group: {e}")
        return jsonify({'success': False, 'message': 'Failed to join group'}), 500


@groups_bp.route('/groups/<int:group_id>/leave', methods=['POST'])
@login_required
def leave_group(group_id):
    """Leave a group"""
    try:
        user_id = g.user['id']
        
        member = GroupMember.query.filter_by(
            group_id=group_id,
            user_id=user_id
        ).first()
        
        if not member:
            return jsonify({'success': False, 'message': 'Not a member'}), 404
        
        group = Group.query.get(group_id)
        if group:
            group.member_count = max(0, group.member_count - 1)
        
        db.session.delete(member)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Left group successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error leaving group: {e}")
        return jsonify({'success': False, 'message': 'Failed to leave group'}), 500


@groups_bp.route('/groups/<int:group_id>/posts', methods=['POST'])
@login_required
def create_group_post(group_id):
    """Create a post in a group"""
    try:
        user_id = g.user['id']
        data = request.get_json()
        
        # Check if user is a member
        is_member = GroupMember.query.filter_by(
            group_id=group_id,
            user_id=user_id
        ).first()
        
        if not is_member:
            return jsonify({'success': False, 'message': 'Must be a member to post'}), 403
        
        if not data.get('content'):
            return jsonify({'success': False, 'message': 'Content is required'}), 400
        
        post = GroupPost(
            group_id=group_id,
            user_id=user_id,
            content=data['content']
        )
        
        db.session.add(post)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Post created successfully',
            'post': post.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating group post: {e}")
        return jsonify({'success': False, 'message': 'Failed to create post'}), 500
