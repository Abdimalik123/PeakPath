from flask import Blueprint, request, jsonify, g
from db import get_db, return_db
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
    activity_level = data.get("activity_level")

    if not all([age, gender, height, current_weight, goal_weight, activity_level]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO user_profiles 
                (user_id, age, gender, height_cm, current_weight_kg, goal_weight_kg, activity_level, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            RETURNING id, age, gender, height_cm, current_weight_kg, goal_weight_kg, activity_level, created_at
        """, (user_id, age, gender, height, current_weight, goal_weight, activity_level))
        profile = cursor.fetchone()
        conn.commit()

        if profile:
            profile_data = {
                "user_id": user_id,
                "age": profile[1],
                "gender": profile[2],
                "height_cm": profile[3],
                "current_weight_kg": profile[4],
                "goal_weight_kg": profile[5],
                "activity_level": profile[6],
                "created_at": profile[7]
            }

        return jsonify({"message": "Profile created successfully", "profile": profile_data}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@user_bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    user_id = g.user['id']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT age, gender, height_cm, current_weight_kg, goal_weight_kg, activity_level 
            FROM user_profiles 
            WHERE user_id = %s
        """, (user_id,))
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
        return_db(conn)


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

    conn = get_db()
    cursor = conn.cursor()
    try:
        # Fetch existing profile
        cursor.execute("""
            SELECT id, age, gender, height_cm, current_weight_kg, goal_weight_kg, activity_level 
            FROM user_profiles 
            WHERE user_id = %s
        """, (user_id,))
        existing = cursor.fetchone()

        if not existing:
            return jsonify({"error": "Profile not found"}), 404

        profile_id = existing[0]
        new_age = age if age is not None else existing[1]
        new_gender = gender if gender is not None else existing[2]
        new_height = height if height is not None else existing[3]
        new_current_weight = current_weight if current_weight is not None else existing[4]
        new_goal_weight = goal_weight if goal_weight is not None else existing[5]
        new_activity_level = activity_level if activity_level is not None else existing[6]

        # Update profile
        cursor.execute("""
            UPDATE user_profiles
            SET age = %s, gender = %s, height_cm = %s, current_weight_kg = %s, goal_weight_kg = %s, activity_level = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND user_id = %s
            RETURNING age, gender, height_cm, current_weight_kg, goal_weight_kg, activity_level
        """, (new_age, new_gender, new_height, new_current_weight, new_goal_weight, new_activity_level, profile_id, user_id))
        updated_profile = cursor.fetchone()
        conn.commit()

        if updated_profile:
            updated_profile_data = {
                "age": updated_profile[0],
                "gender": updated_profile[1],
                "height_cm": updated_profile[2],
                "current_weight_kg": updated_profile[3],
                "goal_weight_kg": updated_profile[4],
                "activity_level": updated_profile[5]
            }
            return jsonify({"message": "Profile updated successfully", "profile": updated_profile_data}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)