from flask import Flask, Blueprint
from flask_cors import CORS
import logging
from logging.handlers import RotatingFileHandler
import os
from dotenv import load_dotenv

load_dotenv()

from routes.auth import auth_bp
from routes.workouts import workouts_bp
from routes.user_profile import user_bp
from routes.habits import habits_bp
from routes.goals import goals_bp
from routes.weight_logs import weight_bp
from routes.notifications import notifications_bp
from routes.activity_logs import activity_bp
from routes.workout_templates import workout_templates_bp
from routes.template_exercises import template_exercises_bp
from routes.gamification import gamification_bp
from routes.summary import summary_bp
from routes.dashboard import dashboard_bp

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

# Configure logging
if not os.path.exists('logs'):
    os.mkdir('logs')

# Create formatter
log_format = '%(asctime)s - %(levelname)s - %(message)s [in %(pathname)s:%(lineno)d]'
formatter = logging.Formatter(log_format)

# File handler
file_handler = RotatingFileHandler('logs/life_tracker.log', maxBytes=10240000, backupCount=10)
file_handler.setFormatter(formatter)
file_handler.setLevel(logging.DEBUG)

# Console handler for real-time viewing
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
console_handler.setLevel(logging.INFO)

# Remove Flask's default handlers to avoid duplicates
app.logger.handlers.clear()

# Configure app logger
app.logger.addHandler(file_handler)
app.logger.addHandler(console_handler)
app.logger.setLevel(logging.DEBUG)
app.logger.propagate = False  # Don't propagate to root logger

app.logger.info('Life Tracker startup')
app.logger.info(f'Log file location: {os.path.abspath("logs/life_tracker.log")}')
app.register_blueprint(auth_bp)
app.register_blueprint(workouts_bp)
app.register_blueprint(user_bp)
app.register_blueprint(habits_bp)
app.register_blueprint(goals_bp)
app.register_blueprint(weight_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(activity_bp)
app.register_blueprint(workout_templates_bp)
app.register_blueprint(template_exercises_bp)
app.register_blueprint(gamification_bp)
app.register_blueprint(summary_bp)
app.register_blueprint(dashboard_bp)

# Health check endpoint
@app.route('/health')
def health_check():
    from datetime import datetime
    return jsonify({
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "service": "Life Tracker API"
    }), 200

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

if __name__ == '__main__':
    app.run(debug=True)