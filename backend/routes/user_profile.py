from flask import Flask, Blueprint, request, jsonify, g
from db import conn
from routes.auth import login_required

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
    activity_level = data.get("activty_level")

    if not all([age, gender, height, current_weight, goal_weight, activity_level]):
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO user_profiles (user_id, age, gender, height_cm, current_weight_kg, goal_weight_kg, activity_level) VALUES (%s, %s, %s, %s, %s, %s)", (age, gender, height, current_weight, goal_weight, activity_level))
        conn.commit()
        return jsonify({"message": "Profile created successfully"}), 201
    except Exception as e:  
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()


@user_bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    user_id = g.user['id']
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT age, gender, height_cm, current_weight_kg, goal_weight_kg, activity_level FROM user_profiles WHERE user_id = %s",(user_id,))
        profile = cursor.fetchone()
        if profile:
            profile_data = {
                "age": profile[0],
                "gender": profile[1],
                "height_cm": profile[2],
                "current_weight_kg": profile[3],
                "goal_weight_kg": profile[4],
                "activity_level": profile[5]
            }
            return jsonify(profile_data), 200
        else:
            return jsonify({"error": "Profile not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()

@user_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    user_id = g.user['id']
    data = request.get_json()

    age = data.get("age")
    gender = data.get("gender")
    height = data.get("height")
    current_weight = data.get("current_weight")
    goal_weight = data.get("goal_weight")
    activity_level = data.get("activity_level")
   
   try:
    cursor = conn.cursor()
    # Fetch existing profile
    cursor.execute("SELECT id, age, gender, height_cm, current_weight_kg, goal_weight_kg, activity_level FROM user_profiles WHERE user_id = %s", (user_id,))
    existing = cursor.fetchone()

    if not existing:
        return jsonify({"error": "Profile not found"}), 404

    profile_id = existing[0]
    new_age = age if age is not None else existing[0]
    new_gender = gender if gender is not None else existing[1]
    new_height = height if height is not None else existing[2]
    new_current_weight = current_weight if current_weight is not None else existing[3]
    new_goal_weight = goal_weight if goal_weight is not None else existing[4]
    new_activity_level = activity_level if activity_level is not None else existing[5]

    # Update profile
    cursor.execute("""
        UPDATE user_profiles
        SET age = %s, gender = %s, height_cm = %s, current_weight_kg = %s, goal_weight_kg = %s, activity_level = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s AND user_id = %s
    """, (new_age, new_height, new_current_weight, new_goal_weight, new_activity_level, profile_id, user_id))
    conn.commit()
    return jsonify({"message": "Profile updated successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
