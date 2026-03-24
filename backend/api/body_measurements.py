from flask import Blueprint, request, jsonify, g, current_app
from database import db
from models.body_measurement import BodyMeasurement
from api.auth import login_required
from utils.logging import log_activity
from utils.validators import validate_request, BodyMeasurementSchema
from sqlalchemy import desc, func
from datetime import datetime, timedelta

body_measurements_bp = Blueprint('body_measurements_bp', __name__)


@body_measurements_bp.route('/body-measurements', methods=['POST'])
@login_required
@validate_request(BodyMeasurementSchema)
def log_measurement():
    """Log a new body measurement"""
    data = request.validated_data

    weight_kg = data['weight_kg']
    measured_at = data.get('measured_at') or datetime.now().date()

    try:
        existing = BodyMeasurement.query.filter_by(
            user_id=g.user['id'],
            measured_at=measured_at
        ).first()

        measurement_fields = {
            'weight_kg': weight_kg,
            'chest': data.get('chest'),
            'waist': data.get('waist'),
            'hips': data.get('hips'),
            'bicep_left': data.get('bicep_left'),
            'bicep_right': data.get('bicep_right'),
            'thigh_left': data.get('thigh_left'),
            'thigh_right': data.get('thigh_right'),
            'calf_left': data.get('calf_left'),
            'calf_right': data.get('calf_right'),
            'neck': data.get('neck'),
            'shoulders': data.get('shoulders'),
            'body_fat_percentage': data.get('body_fat_percentage'),
            'notes': data.get('notes'),
        }

        if existing:
            for k, v in measurement_fields.items():
                setattr(existing, k, v)
            existing.updated_at = datetime.utcnow()
            db.session.commit()
            log_activity(g.user['id'], "updated", "body_measurement", existing.id)
            return jsonify({
                "success": True,
                "message": "Measurement updated successfully",
                "measurement": existing.to_dict()
            }), 200
        else:
            measurement = BodyMeasurement(
                user_id=g.user['id'],
                measured_at=measured_at,
                **measurement_fields
            )
            db.session.add(measurement)
            db.session.commit()
            log_activity(g.user['id'], "created", "body_measurement", measurement.id)
            return jsonify({
                "success": True,
                "message": "Measurement logged successfully",
                "measurement": measurement.to_dict()
            }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error logging measurement: {e}")
        return jsonify({"success": False, "message": "Internal server error"}), 500


@body_measurements_bp.route('/body-measurements', methods=['GET'])
@login_required
def get_measurements():
    """Get all body measurements for the user"""
    try:
        days = request.args.get('days', type=int)
        
        query = BodyMeasurement.query.filter_by(user_id=g.user['id'])
        
        if days:
            cutoff_date = datetime.now().date() - timedelta(days=days)
            query = query.filter(BodyMeasurement.measured_at >= cutoff_date)
        
        measurements = query.order_by(desc(BodyMeasurement.measured_at)).all()
        
        return jsonify({
            "success": True,
            "measurements": [m.to_dict() for m in measurements]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching measurements: {e}")
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500


@body_measurements_bp.route('/body-measurements/stats', methods=['GET'])
@login_required
def get_measurement_stats():
    """Get weight and measurement statistics"""
    try:
        user_id = g.user['id']
        
        # Get all measurements ordered by date
        measurements = BodyMeasurement.query.filter_by(
            user_id=user_id
        ).order_by(BodyMeasurement.measured_at).all()
        
        if not measurements:
            return jsonify({
                "success": True,
                "stats": {
                    "current_weight": None,
                    "starting_weight": None,
                    "total_change": None,
                    "lowest_weight": None,
                    "highest_weight": None,
                    "average_weight": None,
                    "measurement_count": 0,
                    "days_tracked": 0
                }
            }), 200
        
        weights = [m.weight_kg for m in measurements]
        
        current_weight = measurements[-1].weight_kg
        starting_weight = measurements[0].weight_kg
        total_change = current_weight - starting_weight
        
        # Calculate stats
        stats = {
            "current_weight": float(current_weight),
            "starting_weight": float(starting_weight),
            "total_change": float(total_change),
            "lowest_weight": float(min(weights)),
            "highest_weight": float(max(weights)),
            "average_weight": float(sum(weights) / len(weights)),
            "measurement_count": len(measurements),
            "days_tracked": (measurements[-1].measured_at - measurements[0].measured_at).days
        }
        
        # Weekly change (last 7 days)
        week_ago = datetime.now().date() - timedelta(days=7)
        recent_measurements = [m for m in measurements if m.measured_at >= week_ago]
        if len(recent_measurements) >= 2:
            weekly_change = recent_measurements[-1].weight_kg - recent_measurements[0].weight_kg
            stats['weekly_change'] = float(weekly_change)
        
        # Monthly change (last 30 days)
        month_ago = datetime.now().date() - timedelta(days=30)
        month_measurements = [m for m in measurements if m.measured_at >= month_ago]
        if len(month_measurements) >= 2:
            monthly_change = month_measurements[-1].weight_kg - month_measurements[0].weight_kg
            stats['monthly_change'] = float(monthly_change)
        
        return jsonify({
            "success": True,
            "stats": stats
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error calculating stats: {e}")
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500


@body_measurements_bp.route('/body-measurements/<int:measurement_id>', methods=['GET'])
@login_required
def get_measurement(measurement_id):
    """Get a specific measurement"""
    try:
        measurement = BodyMeasurement.query.filter_by(
            id=measurement_id,
            user_id=g.user['id']
        ).first()
        
        if not measurement:
            return jsonify({
                "success": False,
                "message": "Measurement not found"
            }), 404
        
        return jsonify({
            "success": True,
            "measurement": measurement.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching measurement: {e}")
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500


@body_measurements_bp.route('/body-measurements/<int:measurement_id>', methods=['DELETE'])
@login_required
def delete_measurement(measurement_id):
    """Delete a measurement"""
    try:
        measurement = BodyMeasurement.query.filter_by(
            id=measurement_id,
            user_id=g.user['id']
        ).first()
        
        if not measurement:
            return jsonify({
                "success": False,
                "message": "Measurement not found"
            }), 404
        
        db.session.delete(measurement)
        db.session.commit()
        
        log_activity(g.user['id'], "deleted", "body_measurement", measurement_id)
        
        return jsonify({
            "success": True,
            "message": "Measurement deleted successfully"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting measurement: {e}")
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500