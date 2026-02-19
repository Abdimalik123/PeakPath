from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models import Habit, HabitLog
from api.auth import login_required
from utils.logging import log_activity
from utils.rewards import on_habit_logged
from datetime import date, time

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
    next_occurrence = data.get("next_occurrence")

    if not all([name, frequency, reminder_time, description, next_occurrence]):
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    try:
        habit = Habit(
            user_id=user_id,
            name=name,
            frequency=frequency,
            reminder_time=reminder_time,
            description=description,
            next_occurrence=next_occurrence
        )
        
        db.session.add(habit)
        db.session.commit()
        
        log_activity(user_id, "created", "habit", habit.id)
        
        return jsonify({
            "success": True, 
            "message": "Habit added successfully", 
            "habit_id": habit.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating habit: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@habits_bp.route('/habits', methods=['GET'])
@login_required
def get_habits():
    user_id = g.user['id']
    
    try:
        habits = Habit.query.filter_by(user_id=user_id).order_by(Habit.created_at.desc()).all()
        
        habits_list = []
        for habit in habits:
            habits_list.append({
                "id": habit.id,
                "name": habit.name,
                "frequency": habit.frequency,
                "reminder_time": habit.reminder_time.strftime("%H:%M") if isinstance(habit.reminder_time, time) else str(habit.reminder_time),
                "description": habit.description,
                "next_occurrence": habit.next_occurrence.isoformat() if isinstance(habit.next_occurrence, date) else str(habit.next_occurrence),
                "created_at": habit.created_at,
                "updated_at": habit.updated_at
            })
        
        return jsonify({"success": True, "habits": habits_list}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching habits: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@habits_bp.route('/habits/<int:habit_id>', methods=['GET'])
@login_required
def get_habit(habit_id):
    user_id = g.user['id']
    
    try:
        habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first()
        
        if not habit:
            return jsonify({"success": False, "message": "Habit not found"}), 404
        
        habit_info = {
            "id": habit.id,
            "name": habit.name,
            "frequency": habit.frequency,
            "reminder_time": habit.reminder_time,
            "description": habit.description,
            "next_occurrence": habit.next_occurrence,
            "created_at": habit.created_at,
            "updated_at": habit.updated_at
        }
        
        return jsonify({"success": True, "habit": habit_info}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching habit: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@habits_bp.route('/habits/<int:habit_id>', methods=['PUT'])
@login_required
def update_habit(habit_id):
    user_id = g.user['id']
    data = request.get_json()

    try:
        habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first()
        
        if not habit:
            return jsonify({"success": False, "message": "Habit not found"}), 404

        if data.get("name") is not None:
            habit.name = data["name"]
        if data.get("frequency") is not None:
            habit.frequency = data["frequency"]
        if data.get("reminder_time") is not None:
            habit.reminder_time = data["reminder_time"]
        if data.get("description") is not None:
            habit.description = data["description"]
        if data.get("next_occurrence") is not None:
            habit.next_occurrence = data["next_occurrence"]

        db.session.commit()
        
        log_activity(user_id, "updated", "habit", habit_id)
        
        return jsonify({"success": True, "message": "Habit updated successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating habit: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@habits_bp.route('/habits/<int:habit_id>', methods=['DELETE'])
@login_required
def delete_habit(habit_id):
    user_id = g.user['id']
    
    try:
        habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first()
        
        if not habit:
            return jsonify({"success": False, "message": "Habit not found"}), 404
        
        db.session.delete(habit)
        db.session.commit()
        
        log_activity(user_id, "deleted", "habit", habit_id)
        
        return jsonify({"success": True, "message": "Habit deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting habit: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@habits_bp.route('/habits/<int:habit_id>/log', methods=['POST'])
@login_required
def log_habit(habit_id):
    user_id = g.user['id']
    data = request.get_json()
    completed = data.get("completed", True)
    timestamp = data.get("timestamp")
    amount = data.get("amount")
    notes = data.get("notes")

    try:
        # Check habit exists and belongs to user
        habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first()
        if not habit:
            return jsonify({"success": False, "message": "Habit not found"}), 404

        # Prevent duplicate logs on the same day
        today = date.today()
        existing_log = HabitLog.query.filter_by(habit_id=habit_id).filter(
            db.func.date(HabitLog.timestamp) == today
        ).first()
        if existing_log:
            return jsonify({"success": False, "message": "Habit already logged today"}), 400

        # Create log
        habit_log = HabitLog(
            habit_id=habit_id,
            timestamp=timestamp,
            completed=completed,
            amount=amount,
            notes=notes
        )
        
        db.session.add(habit_log)
        db.session.commit()

        # Award points, check achievements, sync goals
        on_habit_logged(user_id, habit_id, habit_log)
        db.session.commit()

        return jsonify({"success": True, "message": "Habit log created"}), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error logging habit: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@habits_bp.route('/habits/<int:habit_id>/logs', methods=['GET'])
@login_required
def get_habit_logs(habit_id):
    user_id = g.user['id']
    
    try:
        habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first()
        if not habit:
            return jsonify({"error": "Habit not found"}), 404
        
        logs = HabitLog.query.filter_by(habit_id=habit_id).order_by(HabitLog.timestamp.desc()).all()
        logs_list = [log.to_dict() for log in logs]
        
        return jsonify({"success": True, "logs": logs_list}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching habit logs: {e}")
        return jsonify({"success": False, "message": str(e)}), 500