from flask import Flask, Blueprint, jsonify
from flask_cors import CORS
import logging
from logging.handlers import RotatingFileHandler
import os
from db import connection_pool, get_db, return_db

from api.auth import auth_bp
from api.workouts import workouts_bp
from api.exercises import exercises_bp
from api.user_profile import user_bp
from api.habits import habits_bp
from api.goals import goals_bp
from api.weight_logs import weight_bp
from api.notifications import notifications_bp
from api.activity_logs import activity_bp
from api.workout_templates import workout_templates_bp
from api.template_exercises import template_exercises_bp
from api.gamification import gamification_bp
from api.summary import summary_bp
from api.dashboard import dashboard_bp

app = Flask(__name__)

# Configure CORS with specific origins
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
CORS(app, resources={
    r"/*": {
        "origins": [FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 3600
    }
})
# Use a persistent volume in Docker for logs: /app/logs
file_handler = RotatingFileHandler('/app/logs/life_tracker.log', maxBytes=10_240_000, backupCount=10)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
file_handler.setLevel(logging.INFO)

# Remove Flask default handlers
app.logger.handlers.clear()
app.logger.addHandler(file_handler)
app.logger.setLevel(logging.INFO)
app.logger.propagate = False

app.logger.info('Life Tracker startup')

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(workouts_bp, url_prefix='/api')
app.register_blueprint(exercises_bp, url_prefix='/api')
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(habits_bp, url_prefix='/api')
app.register_blueprint(goals_bp, url_prefix='/api/')
app.register_blueprint(weight_bp, url_prefix='/api/')
app.register_blueprint(notifications_bp, url_prefix='/api')
app.register_blueprint(activity_bp, url_prefix='/api')
app.register_blueprint(workout_templates_bp, url_prefix='/api')
app.register_blueprint(template_exercises_bp, url_prefix='/api')
app.register_blueprint(gamification_bp, url_prefix='/api')
app.register_blueprint(summary_bp, url_prefix='/api')
app.register_blueprint(dashboard_bp, url_prefix='/api')

# Health check endpoint
@app.route('/health')
def health_check():
    from datetime import datetime

    db_status = "unknown"
    db_error = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        return_db(conn)
        db_status = "connected"
    except Exception as e:
        db_error = "disconnected"
        db_error = str(e)
        app.logger.error(f"Database health check failed: {e}")

    response = {
        "status": "ok" if db_status == "connected" else "degraded",
        "timestamp": datetime.now().isoformat(),
        "service": "Life Tracker API",
        "database": db_status
    }

    if db_error:
        response["database_error"] = db_error

    status_code = 200 if db_status == "connected" else 503
    return jsonify(response), status_code

# Global error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({
        "success": False,
        "message": "Endpoint not found",
        "error": "Not Found"
    }), 404

@app.errorhandler(500)
def internal_error(e):
    app.logger.error(f'Server Error: {str(e)}')
    return jsonify({
        "success": False,
        "message": "Internal server error",
        "error": "Server Error"
    }), 500

@app.errorhandler(400)
def bad_request(e):
    return jsonify({
        "success": False,
        "message": "Bad request",
        "error": str(e)
    }), 400


# On shutdown, close all database connections
@app.teardown_appcontext
def close_db(exception=None):
    if connection_pool:
        connection_pool.closeall()
        app.logger.info('Database connections closed') 

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000,debug=True)