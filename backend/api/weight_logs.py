from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models import WeightLog
from api.auth import login_required
from utils.rewards import on_weight_logged

weight_bp = Blueprint('weight_bp', __name__)


@weight_bp.route('/weight_logs', methods=['POST'])
@login_required
def add_weight():
    user_id = g.user['id']
    data = request.get_json()
    weight = data.get("weight_kg")
    date = data.get("date")
    
    if weight is None:
        return jsonify({"success": False, "message": "Missing weight"}), 400
    
    try:
        weight_log = WeightLog(
            user_id=user_id,
            weight_kg=weight,
            date=date
        )
        
        db.session.add(weight_log)
        db.session.commit()

        # Award points
        on_weight_logged(user_id, weight_log.id)
        db.session.commit()

        return jsonify({"success": True, "weight_id": weight_log.id}), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding weight log: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@weight_bp.route('/weight_logs', methods=['GET'])
@login_required
def get_weight_logs():
    user_id = g.user['id']
    
    try:
        logs = WeightLog.query.filter_by(user_id=user_id).order_by(WeightLog.date.desc()).all()
        
        result = [{
            "id": w.id, 
            "weight_kg": float(w.weight_kg), 
            "date": str(w.date), 
            "created_at": str(w.created_at)
        } for w in logs]
        
        return jsonify({"success": True, "weight_logs": result}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching weight logs: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@weight_bp.route('/weight_logs/<int:log_id>', methods=['PUT'])
@login_required
def update_weight_log(log_id):
    user_id = g.user['id']
    data = request.get_json()
    new_weight = data.get("weight_kg")
    new_date = data.get("date")
    
    if new_weight is None:
        return jsonify({"success": False, "message": "Missing weight"}), 400
    
    try:
        weight_log = WeightLog.query.filter_by(id=log_id, user_id=user_id).first()
        
        if not weight_log:
            return jsonify({"success": False, "message": "Weight log not found"}), 404
        
        weight_log.weight_kg = new_weight
        if new_date:
            weight_log.date = new_date
        
        db.session.commit()
        
        return jsonify({"success": True, "message": "Weight log updated"}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating weight log: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@weight_bp.route('/weight_logs/<int:log_id>', methods=['DELETE'])
@login_required
def delete_weight_log(log_id):
    user_id = g.user['id']
    
    try:
        weight_log = WeightLog.query.filter_by(id=log_id, user_id=user_id).first()
        
        if not weight_log:
            return jsonify({"success": False, "message": "Weight log not found"}), 404
        
        db.session.delete(weight_log)
        db.session.commit()
        
        return jsonify({"success": True, "message": "Weight log deleted"}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting weight log: {e}")
        return jsonify({"success": False, "message": str(e)}), 500