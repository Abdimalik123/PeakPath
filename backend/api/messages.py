from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models.message import Conversation, Message
from models import User
from api.auth import login_required
from datetime import datetime
from sqlalchemy import or_, and_

messages_bp = Blueprint('messages_bp', __name__)


@messages_bp.route('/conversations', methods=['GET'])
@login_required
def get_conversations():
    """Get all conversations for the current user"""
    try:
        user_id = g.user['id']
        
        # Get all conversations where user is participant
        conversations = Conversation.query.filter(
            or_(
                Conversation.user1_id == user_id,
                Conversation.user2_id == user_id
            )
        ).order_by(
            Conversation.last_message_at.desc()
        ).all()
        
        result = []
        for conv in conversations:
            # Get the other user
            other_user_id = conv.user2_id if conv.user1_id == user_id else conv.user1_id
            other_user = User.query.get(other_user_id)
            
            # Get last message
            last_message = Message.query.filter_by(
                conversation_id=conv.id
            ).order_by(
                Message.created_at.desc()
            ).first()
            
            # Count unread messages
            unread_count = Message.query.filter_by(
                conversation_id=conv.id,
                is_read=False
            ).filter(
                Message.sender_id != user_id
            ).count()
            
            # Use email as username if no username field exists
            username = other_user.email.split('@')[0] if other_user and other_user.email else f"User{other_user_id}"
            
            result.append({
                'id': conv.id,
                'other_user': {
                    'id': other_user.id if other_user else other_user_id,
                    'username': username,
                    'profile_picture': None
                } if other_user else None,
                'last_message': {
                    'content': last_message.content,
                    'created_at': last_message.created_at.isoformat(),
                    'is_mine': last_message.sender_id == user_id
                } if last_message else None,
                'unread_count': unread_count,
                'last_message_at': conv.last_message_at.isoformat() if conv.last_message_at else None
            })
        
        return jsonify({
            'success': True,
            'conversations': result
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching conversations: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch conversations'}), 500


@messages_bp.route('/conversations/<int:user_id>', methods=['GET'])
@login_required
def get_or_create_conversation(user_id):
    """Get or create a conversation with a specific user"""
    try:
        current_user_id = g.user['id']
        
        if current_user_id == user_id:
            return jsonify({'success': False, 'message': 'Cannot message yourself'}), 400
        
        # Check if conversation exists
        conversation = Conversation.query.filter(
            or_(
                and_(Conversation.user1_id == current_user_id, Conversation.user2_id == user_id),
                and_(Conversation.user1_id == user_id, Conversation.user2_id == current_user_id)
            )
        ).first()
        
        if not conversation:
            # Create new conversation
            conversation = Conversation(
                user1_id=current_user_id,
                user2_id=user_id
            )
            db.session.add(conversation)
            db.session.commit()
        
        return jsonify({
            'success': True,
            'conversation_id': conversation.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error getting/creating conversation: {e}")
        return jsonify({'success': False, 'message': 'Failed to get conversation'}), 500


@messages_bp.route('/conversations/<int:conversation_id>/messages', methods=['GET'])
@login_required
def get_messages(conversation_id):
    """Get all messages in a conversation"""
    try:
        user_id = g.user['id']
        
        # Verify user is part of conversation
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            return jsonify({'success': False, 'message': 'Conversation not found'}), 404
        
        if conversation.user1_id != user_id and conversation.user2_id != user_id:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
        # Get messages
        messages = Message.query.filter_by(
            conversation_id=conversation_id
        ).order_by(
            Message.created_at.asc()
        ).all()
        
        # Mark messages as read
        Message.query.filter_by(
            conversation_id=conversation_id,
            is_read=False
        ).filter(
            Message.sender_id != user_id
        ).update({'is_read': True})
        db.session.commit()
        
        result = []
        for msg in messages:
            sender = User.query.get(msg.sender_id)
            # Use email as username if no username field exists
            sender_username = sender.email.split('@')[0] if sender and sender.email else 'Unknown'
            result.append({
                'id': msg.id,
                'sender_id': msg.sender_id,
                'sender_username': sender_username,
                'content': msg.content,
                'is_read': msg.is_read,
                'created_at': msg.created_at.isoformat() if msg.created_at else None,
                'is_mine': msg.sender_id == user_id
            })
        
        return jsonify({
            'success': True,
            'messages': result
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching messages: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch messages'}), 500


@messages_bp.route('/conversations/<int:conversation_id>/messages', methods=['POST'])
@login_required
def send_message(conversation_id):
    """Send a message in a conversation"""
    try:
        user_id = g.user['id']
        data = request.get_json()
        
        # Verify user is part of conversation
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            return jsonify({'success': False, 'message': 'Conversation not found'}), 404
        
        if conversation.user1_id != user_id and conversation.user2_id != user_id:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
        if not data.get('content'):
            return jsonify({'success': False, 'message': 'Message content is required'}), 400
        
        message = Message(
            conversation_id=conversation_id,
            sender_id=user_id,
            content=data['content']
        )
        
        db.session.add(message)
        
        # Update conversation last_message_at
        conversation.last_message_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': message.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error sending message: {e}")
        return jsonify({'success': False, 'message': 'Failed to send message'}), 500


@messages_bp.route('/messages/unread-count', methods=['GET'])
@login_required
def get_unread_count():
    """Get total unread message count"""
    try:
        user_id = g.user['id']
        
        # Get all conversations
        conversations = Conversation.query.filter(
            or_(
                Conversation.user1_id == user_id,
                Conversation.user2_id == user_id
            )
        ).all()
        
        total_unread = 0
        for conv in conversations:
            unread = Message.query.filter_by(
                conversation_id=conv.id,
                is_read=False
            ).filter(
                Message.sender_id != user_id
            ).count()
            total_unread += unread
        
        return jsonify({
            'success': True,
            'unread_count': total_unread
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting unread count: {e}")
        return jsonify({'success': False, 'message': 'Failed to get unread count'}), 500
