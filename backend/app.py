from flask import Flask, Blueprint
from routes.auth import auth_bp
from routes.workouts import workouts_bp
from routes.user_profile import user_bp
from routes.habits import habits_bp
from routes.goals import goals_bp

app = Flask(__name__)
app.register_blueprint(auth_bp)
app.register_blueprint(workouts_bp)
app.register_blueprint(user_bp)
app.register_blueprint(habits_bp)
app.register_blueprint(goals_bp)
if __name__ == '__main__':
    app.run(debug=True)