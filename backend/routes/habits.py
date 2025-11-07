from flask import Flask, Blueprint, request, jsonify, g
from db import conn
from routes.auth import login_required

habits_bp = Blueprint('habits_bp', __name__)

@habits_bp.route('/habits', methods=['POST'])
@login_required
def add_habit():
    user_id = g.user['id']
    
    data = request.get_json()
    name = data.get("name")
    frequency = data.get("frequency")
    reminder_time = data.get("reminder_time")
    description = data.get("description")
    next_occurence = data.get("next_occurence")

    if not all([name, frequency, reminder_time, description, next_occurence]):
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO habits (user_id, name, frequency, reminder_time, description, next_occurence) VALUES (%s, %s, %s, %s, %s, %s)", (user_id, name,frequency, reminder_time, description,next_occurence))
        conn.commit()
        return jsonify({"success": True, "message": "Habit added successfully"}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

@habits_bp('/workouts', methods = ['GET'])
@login_required
def get_habits():
    user_id = g.user['id']

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM habits WHERE user_id = %s", (user_id,))
        habits = cursor.fetchall()
        habits_list = []
        for habit in habits:
            habit_dict = {
                "name": habit[2],
                "frequency": habit[3],
                "reminder_time": habit[4],
                "description": habit[5],
                "next_occurence": habit[6],
                "created_at": habit[7]
                "updated_at": habit[8]
            }
            habits_list.append(habit_dict)
        return jsonify({"success": True, "habits": habits_list}), 200
    except Exception as e:
        return jsonify({"success": False, "message", str(e)}), 500
