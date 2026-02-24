from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models import ProgressPhoto
from api.auth import login_required
from utils.logging import log_activity
from datetime import datetime
import base64
import os
import uuid

progress_photos_bp = Blueprint('progress_photos', __name__)


@progress_photos_bp.route('/progress-photos', methods=['GET'])
@login_required
def get_progress_photos():
    """Get all progress photos for the current user"""
    try:
        user_id = g.user['id']
        
        photos = ProgressPhoto.query.filter_by(user_id=user_id).order_by(
            ProgressPhoto.photo_date.desc()
        ).all()
        
        result = []
        for photo in photos:
            result.append({
                'id': photo.id,
                'url': photo.photo_url,
                'date': photo.photo_date.isoformat(),
                'weight': photo.weight,
                'notes': photo.notes,
                'type': photo.photo_type
            })
        
        return jsonify({
            'success': True,
            'photos': result
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching progress photos: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch progress photos'
        }), 500


@progress_photos_bp.route('/progress-photos', methods=['POST'])
@login_required
def upload_progress_photo():
    """Upload a new progress photo"""
    try:
        user_id = g.user['id']
        
        # Check if request has file or base64 data
        if 'photo' in request.files:
            # Handle file upload
            file = request.files['photo']
            
            if not file or file.filename == '':
                return jsonify({
                    'success': False,
                    'message': 'No file provided'
                }), 400
            
            # Validate file type
            allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
            file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
            
            if file_ext not in allowed_extensions:
                return jsonify({
                    'success': False,
                    'message': 'Invalid file type. Allowed: png, jpg, jpeg, gif, webp'
                }), 400
            
            # Generate unique filename
            filename = f"{uuid.uuid4()}.{file_ext}"
            
            # In production, upload to S3 or similar
            # For now, save locally or use base64
            upload_folder = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'progress_photos')
            os.makedirs(upload_folder, exist_ok=True)
            
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)
            
            # In production, this would be the S3 URL
            photo_url = f"/uploads/progress_photos/{filename}"
            
        elif request.is_json:
            # Handle base64 data
            data = request.get_json()
            
            if not data.get('photo_data'):
                return jsonify({
                    'success': False,
                    'message': 'No photo data provided'
                }), 400
            
            # For now, store base64 directly (in production, decode and upload to S3)
            photo_url = data['photo_data']
            
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid request format'
            }), 400
        
        # Get form data
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form
        
        # Parse date
        photo_date_str = data.get('date', datetime.utcnow().date().isoformat())
        try:
            photo_date = datetime.strptime(photo_date_str, '%Y-%m-%d').date()
        except ValueError:
            photo_date = datetime.utcnow().date()
        
        # Create progress photo record
        progress_photo = ProgressPhoto(
            user_id=user_id,
            photo_url=photo_url,
            photo_type=data.get('type', 'front'),
            photo_date=photo_date,
            weight=float(data['weight']) if data.get('weight') else None,
            notes=data.get('notes')
        )
        
        db.session.add(progress_photo)
        db.session.commit()
        
        log_activity(user_id, "uploaded", "progress_photo", progress_photo.id)
        
        return jsonify({
            'success': True,
            'message': 'Progress photo uploaded successfully',
            'photo': {
                'id': progress_photo.id,
                'url': progress_photo.photo_url,
                'date': progress_photo.photo_date.isoformat(),
                'weight': progress_photo.weight,
                'notes': progress_photo.notes,
                'type': progress_photo.photo_type
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error uploading progress photo: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to upload progress photo'
        }), 500


@progress_photos_bp.route('/progress-photos/<int:photo_id>', methods=['GET'])
@login_required
def get_progress_photo(photo_id):
    """Get a specific progress photo"""
    try:
        user_id = g.user['id']
        
        photo = ProgressPhoto.query.filter_by(
            id=photo_id,
            user_id=user_id
        ).first()
        
        if not photo:
            return jsonify({
                'success': False,
                'message': 'Progress photo not found'
            }), 404
        
        return jsonify({
            'success': True,
            'photo': {
                'id': photo.id,
                'url': photo.photo_url,
                'date': photo.photo_date.isoformat(),
                'weight': photo.weight,
                'notes': photo.notes,
                'type': photo.photo_type
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching progress photo: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch progress photo'
        }), 500


@progress_photos_bp.route('/progress-photos/<int:photo_id>', methods=['PUT'])
@login_required
def update_progress_photo(photo_id):
    """Update progress photo metadata"""
    try:
        user_id = g.user['id']
        data = request.get_json()
        
        photo = ProgressPhoto.query.filter_by(
            id=photo_id,
            user_id=user_id
        ).first()
        
        if not photo:
            return jsonify({
                'success': False,
                'message': 'Progress photo not found'
            }), 404
        
        # Update fields
        if 'date' in data:
            try:
                photo.photo_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except ValueError:
                pass
        
        if 'weight' in data:
            photo.weight = float(data['weight']) if data['weight'] else None
        
        if 'notes' in data:
            photo.notes = data['notes']
        
        if 'type' in data:
            photo.photo_type = data['type']
        
        db.session.commit()
        
        log_activity(user_id, "updated", "progress_photo", photo_id)
        
        return jsonify({
            'success': True,
            'message': 'Progress photo updated successfully',
            'photo': {
                'id': photo.id,
                'url': photo.photo_url,
                'date': photo.photo_date.isoformat(),
                'weight': photo.weight,
                'notes': photo.notes,
                'type': photo.photo_type
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating progress photo: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to update progress photo'
        }), 500


@progress_photos_bp.route('/progress-photos/<int:photo_id>', methods=['DELETE'])
@login_required
def delete_progress_photo(photo_id):
    """Delete a progress photo"""
    try:
        user_id = g.user['id']
        
        photo = ProgressPhoto.query.filter_by(
            id=photo_id,
            user_id=user_id
        ).first()
        
        if not photo:
            return jsonify({
                'success': False,
                'message': 'Progress photo not found'
            }), 404
        
        # In production, also delete from S3
        # if not photo.photo_url.startswith('data:'):
        #     delete_from_s3(photo.photo_url)
        
        db.session.delete(photo)
        db.session.commit()
        
        log_activity(user_id, "deleted", "progress_photo", photo_id)
        
        return jsonify({
            'success': True,
            'message': 'Progress photo deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting progress photo: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to delete progress photo'
        }), 500
