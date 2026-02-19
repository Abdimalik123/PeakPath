from sqlalchemy.exc import SQLAlchemyError
from flask import Flask, Blueprint, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
import logging
from logging.handlers import RotatingFileHandler
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from database import db, migrate, limiter

def create_app():
    app = Flask(__name__)

    #Database configuration
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_NAME = os.getenv('DB_NAME', 'life_tracker_db')
    DB_USERNAME = os.getenv('DB_USERNAME', 'lfadmin')
    DB_PASSWORD = os.getenv('DB_PASSWORD') 

    if not DB_PASSWORD:
        raise EnvironmentError('DB_PASSWORD is not set')
    DATABASE_URL = f"postgresql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
    }

    db.init_app(app)
    migrate.init_app(app, db)

    from models import (
        User, UserProfile, WeightLog, Workout, Exercise, 
        WorkoutExercise, WorkoutTemplate, TemplateExercise,
        Habit, HabitLog, Goal, GoalLink, NutritionLog, 
        Notification, ActivityLog, UserPoint, UserAchievement, 
        PointTransaction
        )
    
    # Configure CORS with specific origins
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    DOMAIN_URL = os.getenv('DOMAIN_URL', '')
    cors_origins = [FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"]
    if DOMAIN_URL:
        cors_origins.append(DOMAIN_URL)
    CORS(app, resources={
        r"/*": {
        "origins": cors_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 3600
        }
        }
    )

    # Rate limiting
    limiter.init_app(app)

    # Logging setup
    os.makedirs('logs', exist_ok=True)
    file_handler = RotatingFileHandler(
        'logs/life_tracker.log', 
        maxBytes=10_240_000, 
        backupCount=10
    )
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)
    
    app.logger.handlers.clear()
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.propagate = False
    
    app.logger.info('PeakPath API startup')

    
    # Import blueprints
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

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/v1')
    app.register_blueprint(workouts_bp, url_prefix='/api/v1')
    app.register_blueprint(exercises_bp, url_prefix='/api/v1')
    app.register_blueprint(user_bp, url_prefix='/api/v1')
    app.register_blueprint(habits_bp, url_prefix='/api/v1')
    app.register_blueprint(goals_bp, url_prefix='/api/v1')
    app.register_blueprint(weight_bp, url_prefix='/api/v1')
    app.register_blueprint(notifications_bp, url_prefix='/api/v1')
    app.register_blueprint(activity_bp, url_prefix='/api/v1')
    app.register_blueprint(workout_templates_bp, url_prefix='/api/v1')
    app.register_blueprint(template_exercises_bp, url_prefix='/api/v1')
    app.register_blueprint(gamification_bp, url_prefix='/api/v1')
    app.register_blueprint(summary_bp, url_prefix='/api/v1')
    app.register_blueprint(dashboard_bp, url_prefix='/api/v1')

    # Health check endpoint
    @app.route('/health')
    def health_check():
        from datetime import datetime

        db_status = "unknown"
        db_error = None
        try:
            with db.engine.connect() as conn:
                conn.execute(db.text("SELECT 1"))
            db_status = "connected"
        except SQLAlchemyError as e:
            db_status = "disconnected"
            db_error = str(e)
            app.logger.error(f"Database health check failed: {e}")
        response = {
            "status": "ok" if db_status == "connected" else "degraded",
            "timestamp": datetime.now().isoformat(),
            "service": "PeakPath API",
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

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({
            "success": False,
            "message": "Too many requests",
            "error": "Rate limit exceeded"
        }), 429

    return app



app = create_app()

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5400,debug=True)