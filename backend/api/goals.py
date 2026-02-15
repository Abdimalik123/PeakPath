from flask import Blueprint, request, jsonify, g, current_app
from app import db
from models import Goal
from api.auth import login_required
from utils.logging import log_activity
from datetime import date

goals_bp = Blueprint('goals_bp', __name__)


@goals_bp.route('/goals', methods=['POST'])
@login_required
def add_goal():
    user_id = g.user['id']
    data = request.get_json()

    name = data.get("name")
    goal_type = data.get("goal_type")
    target = data.get("target")
    progress = data.get("progress", 0)
    deadline = data.get("deadline")

    if not all([name, goal_type, target]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        goal = Goal(
            user_id=user_id,
            name=name,
            type=goal_type,
            target=target,
            progress=progress,
            deadline=deadline
        )
        
        db.session.add(goal)
        db.session.commit()
        
        log_activity(user_id, "created", "goal", goal.id)
        
        return jsonify({
            "success": True, 
            "goal_id": goal.id, 
            "message": "Goal added successfully"
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating goal: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@goals_bp.route('/goals', methods=['GET'])
@login_required
def get_goals():
    user_id = g.user['id']
    
    try:
        goals = Goal.query.filter_by(user_id=user_id).order_by(Goal.created_at.desc()).all()
        
        goals_list = [{
            "id": goal.id,
            "user_id": goal.user_id,
            "name": goal.name,
            "type": goal.type,
            "target": goal.target,
            "progress": goal.progress,
            "deadline": goal.deadline.isoformat() if isinstance(goal.deadline, date) else str(goal.deadline),
            "created_at": goal.created_at,
            "updated_at": goal.updated_at
        } for goal in goals]
        
        return jsonify({"success": True, "goals": goals_list}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching goals: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@goals_bp.route('/goals/<int:goal_id>', methods=['GET'])
@login_required
def get_goal(goal_id):
    user_id = g.user['id']
    
    try:
        goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
        
        if not goal:
            return jsonify({"success": False, "message": "Goal not found"}), 404

        goal_dict = {
            "id": goal.id,
            "user_id": goal.user_id,
            "name": goal.name,
            "type": goal.type,
            "target": goal.target,
            "progress": goal.progress,
            "deadline": goal.deadline,
            "created_at": goal.created_at,
            "updated_at": goal.updated_at
        }
        
        return jsonify({"success": True, "goal": goal_dict}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching goal: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@goals_bp.route('/goals/<int:goal_id>', methods=['PUT'])
@login_required
def update_goal(goal_id):
    user_id = g.user['id']
    data = request.get_json()

    try:
        goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
        
        if not goal:
            return jsonify({"success": False, "message": "Goal not found"}), 404

        # Update fields if provided
        if data.get("name") is not None:
            goal.name = data["name"]
        if data.get("goal_type") is not None:
            goal.type = data["goal_type"]
        if data.get("target") is not None:
            goal.target = data["target"]
        if data.get("progress") is not None:
            goal.progress = data["progress"]
        if data.get("deadline") is not None:
            goal.deadline = data["deadline"]

        db.session.commit()
        
        log_activity(user_id, "updated", "goal", goal_id)
        
        return jsonify({"success": True, "message": "Goal updated successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating goal: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@goals_bp.route('/goals/<int:goal_id>', methods=['DELETE'])
@login_required
def delete_goal(goal_id):
    user_id = g.user['id']
    
    try:
        goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
        
        if not goal:
            return jsonify({"success": False, "message": "Goal not found"}), 404
        
        db.session.delete(goal)
        db.session.commit()
        
        log_activity(user_id, "deleted", "goal", goal_id)
        
        return jsonify({"success": True, "message": "Goal deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting goal: {e}")
        return jsonify({"success": False, "message": str(e)}), 500