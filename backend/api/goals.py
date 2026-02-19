from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models import Goal
from models.goal_link import GoalLink
from api.auth import login_required
from utils.logging import log_activity
from utils.goal_sync import recalculate_goal_progress
from datetime import date

goals_bp = Blueprint('goals_bp', __name__)


# ----------------------- GOAL CRUD ----------------------- #

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
    auto_sync = data.get("auto_sync", False)

    if not all([name, goal_type, target]):
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    try:
        goal = Goal(
            user_id=user_id,
            name=name,
            type=goal_type,
            target=target,
            progress=progress,
            deadline=deadline,
            auto_sync=auto_sync,
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

        goals_list = []
        for goal in goals:
            goal_dict = {
                "id": goal.id,
                "user_id": goal.user_id,
                "name": goal.name,
                "type": goal.type,
                "target": goal.target,
                "progress": goal.progress,
                "deadline": goal.deadline.isoformat() if isinstance(goal.deadline, date) else str(goal.deadline) if goal.deadline else None,
                "auto_sync": goal.auto_sync,
                "created_at": goal.created_at.isoformat() if goal.created_at else None,
                "updated_at": goal.updated_at.isoformat() if goal.updated_at else None,
                "links_count": GoalLink.query.filter_by(goal_id=goal.id).count(),
            }
            goals_list.append(goal_dict)

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

        # Include links
        links = GoalLink.query.filter_by(goal_id=goal.id).all()
        links_list = [
            {
                "id": link.id,
                "entity_type": link.entity_type,
                "entity_id": link.entity_id,
                "linked_workout_type": link.linked_workout_type,
                "contribution_value": link.contribution_value,
                "created_at": link.created_at.isoformat() if link.created_at else None,
            }
            for link in links
        ]

        goal_dict = {
            "id": goal.id,
            "user_id": goal.user_id,
            "name": goal.name,
            "type": goal.type,
            "target": goal.target,
            "progress": goal.progress,
            "deadline": goal.deadline.isoformat() if isinstance(goal.deadline, date) else str(goal.deadline) if goal.deadline else None,
            "auto_sync": goal.auto_sync,
            "created_at": goal.created_at.isoformat() if goal.created_at else None,
            "updated_at": goal.updated_at.isoformat() if goal.updated_at else None,
            "links": links_list,
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
        if data.get("auto_sync") is not None:
            goal.auto_sync = data["auto_sync"]

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


# ----------------------- GOAL LINKS ----------------------- #

@goals_bp.route('/goals/<int:goal_id>/links', methods=['POST'])
@login_required
def add_goal_link(goal_id):
    """
    Link a goal to a workout type or habit for auto-progress tracking.

    Body:
        entity_type: "workout" or "habit"
        entity_id: habit_id (required for habits, null for workouts)
        linked_workout_type: workout type string (optional, for workout filtering)
        contribution_value: points per occurrence (default 1)
    """
    user_id = g.user['id']
    data = request.get_json()

    entity_type = data.get("entity_type")
    entity_id = data.get("entity_id")
    linked_workout_type = data.get("linked_workout_type")
    contribution_value = data.get("contribution_value", 1)

    if entity_type not in ("workout", "habit"):
        return jsonify({"success": False, "message": "entity_type must be 'workout' or 'habit'"}), 400

    if entity_type == "habit" and not entity_id:
        return jsonify({"success": False, "message": "entity_id is required for habit links"}), 400

    try:
        goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
        if not goal:
            return jsonify({"success": False, "message": "Goal not found"}), 404

        # Enable auto_sync when a link is added
        goal.auto_sync = True

        link = GoalLink(
            goal_id=goal_id,
            entity_type=entity_type,
            entity_id=entity_id,
            linked_workout_type=linked_workout_type,
            contribution_value=contribution_value,
        )
        db.session.add(link)
        db.session.commit()

        log_activity(user_id, "created", "goal_link", link.id)

        return jsonify({
            "success": True,
            "message": "Goal link created",
            "link_id": link.id,
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating goal link: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@goals_bp.route('/goals/<int:goal_id>/links', methods=['GET'])
@login_required
def get_goal_links(goal_id):
    """Get all links for a goal."""
    user_id = g.user['id']

    try:
        goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
        if not goal:
            return jsonify({"success": False, "message": "Goal not found"}), 404

        links = GoalLink.query.filter_by(goal_id=goal_id).all()
        links_list = [
            {
                "id": link.id,
                "entity_type": link.entity_type,
                "entity_id": link.entity_id,
                "linked_workout_type": link.linked_workout_type,
                "contribution_value": link.contribution_value,
                "created_at": link.created_at.isoformat() if link.created_at else None,
            }
            for link in links
        ]

        return jsonify({"success": True, "links": links_list}), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching goal links: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@goals_bp.route('/goals/<int:goal_id>/links/<int:link_id>', methods=['DELETE'])
@login_required
def delete_goal_link(goal_id, link_id):
    """Remove a link from a goal."""
    user_id = g.user['id']

    try:
        goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
        if not goal:
            return jsonify({"success": False, "message": "Goal not found"}), 404

        link = GoalLink.query.filter_by(id=link_id, goal_id=goal_id).first()
        if not link:
            return jsonify({"success": False, "message": "Link not found"}), 404

        db.session.delete(link)

        # Disable auto_sync if no more links
        remaining = GoalLink.query.filter_by(goal_id=goal_id).count()
        if remaining <= 1:  # 1 because the delete hasn't flushed yet
            goal.auto_sync = False

        db.session.commit()
        log_activity(user_id, "deleted", "goal_link", link_id)

        return jsonify({"success": True, "message": "Goal link removed"}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting goal link: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@goals_bp.route('/goals/<int:goal_id>/recalculate', methods=['POST'])
@login_required
def recalculate_goal(goal_id):
    """Recalculate goal progress from all linked entities."""
    user_id = g.user['id']

    try:
        goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
        if not goal:
            return jsonify({"success": False, "message": "Goal not found"}), 404

        new_progress = recalculate_goal_progress(goal_id, user_id)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Goal progress recalculated",
            "progress": new_progress,
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error recalculating goal: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
