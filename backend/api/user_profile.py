from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models import UserProfile
from api.auth import login_required

user_bp = Blueprint('user_bp', __name__)


@user_bp.route('/profile', methods=['POST'])
@login_required
def add_profile():
    user_id = g.user['id']
    data = request.get_json()

    age = data.get("age")
    gender = data.get("gender")
    height = data.get("height")
    current_weight = data.get("current_weight")
    goal_weight = data.get("goal_weight")
    activity_level = data.get("activity_level")

    if not all([age, gender, height, current_weight, goal_weight, activity_level]):
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    try:
        profile = UserProfile(
            user_id=user_id,
            age=age,
            gender=gender,
            height_cm=height,
            current_weight_kg=current_weight,
            goal_weight_kg=goal_weight,
            activity_level=activity_level
        )
        
        db.session.add(profile)
        db.session.commit()

        profile_data = {
            "user_id": user_id,
            "age": profile.age,
            "gender": profile.gender,
            "height_cm": profile.height_cm,
            "current_weight_kg": profile.current_weight_kg,
            "goal_weight_kg": profile.goal_weight_kg,
            "activity_level": profile.activity_level,
            "created_at": profile.created_at
        }

        return jsonify({"success": True, "message": "Profile created successfully", "profile": profile_data}), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating profile: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@user_bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    user_id = g.user['id']
    
    try:
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        
        if not profile:
            return jsonify({"success": False, "message": "Profile not found"}), 404
        
        profile_data = {
            "age": profile.age,
            "gender": profile.gender,
            "height_cm": profile.height_cm,
            "current_weight_kg": profile.current_weight_kg,
            "goal_weight_kg": profile.goal_weight_kg,
            "activity_level": profile.activity_level
        }
        
        return jsonify(profile_data), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching profile: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@user_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    user_id = g.user['id']
    data = request.get_json()

    try:
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        
        if not profile:
            return jsonify({"success": False, "message": "Profile not found"}), 404

        # Update fields if provided
        if data.get("age") is not None:
            profile.age = data["age"]
        if data.get("gender") is not None:
            profile.gender = data["gender"]
        if data.get("height") is not None:
            profile.height_cm = data["height"]
        if data.get("current_weight") is not None:
            profile.current_weight_kg = data["current_weight"]
        if data.get("goal_weight") is not None:
            profile.goal_weight_kg = data["goal_weight"]
        if data.get("activity_level") is not None:
            profile.activity_level = data["activity_level"]

        db.session.commit()

        updated_profile_data = {
            "age": profile.age,
            "gender": profile.gender,
            "height_cm": profile.height_cm,
            "current_weight_kg": profile.current_weight_kg,
            "goal_weight_kg": profile.goal_weight_kg,
            "activity_level": profile.activity_level
        }
        
        return jsonify({"success": True, "message": "Profile updated successfully", "profile": updated_profile_data}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating profile: {e}")
        return jsonify({"success": False, "message": str(e)}), 500