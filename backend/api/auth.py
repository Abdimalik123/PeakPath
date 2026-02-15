from flask import Blueprint, request, jsonify, g
import functools
from app import db
from models import User
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
from utils.logging import log_activity


SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise Exception("SECRET_KEY environment variable not set")

auth_bp = Blueprint('auth_bp', __name__)


#------------------------- JWT/LOGIN-REQUIRED --------------------------------------------------#
def login_required(view):
    @functools.wraps(view)
    def wrapped_view(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "error": "Missing or invalid token"}), 401
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "error": "Invalid token"}), 401
        g.user = payload
        return view(*args, **kwargs)
    return wrapped_view


#------------------------- REGISTER --------------------------------------------------#
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    firstname = data.get("firstname")
    lastname = data.get("lastname")
    email = data.get("email")
    password = data.get("password")
    confirm_password = data.get("confirm_password")

    # Form validation
    for field_name, field_value in [("firstname", firstname), ("lastname", lastname), 
                                     ("email", email), ("password", password), 
                                     ("confirm_password", confirm_password)]:
        if not field_value:
            return jsonify({"success": False, "message": f"Missing {field_name}"}), 400
    
    if confirm_password != password:
        return jsonify({"success": False, "message": "Passwords do not match"}), 400

    try:
        # Check if user exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"success": False, "message": "User already exists"}), 400

        # Create new user
        hashed_password = generate_password_hash(password)
        user = User(
            firstname=firstname,
            lastname=lastname,
            email=email,
            password_hash=hashed_password
        )
        
        db.session.add(user)
        db.session.commit()

        # Log the creation
        log_activity(user.id, "created", "user", user.id)

        # Generate token
        payload = {
            "id": user.id,
            "firstname": firstname,
            "lastname": lastname,
            "email": email,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
        
        return jsonify({
            "success": True, 
            "message": "Registered successfully", 
            "user_id": user.id, 
            "token": token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


#------------------------- LOGIN --------------------------------------------------#
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    
    if not email:
        return jsonify({"success": False, "message": "Email is required"}), 400
    if not password:
        return jsonify({"success": False, "message": "Password is required"}), 400

    try:
        # Find user
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({"success": False, "message": "User does not exist"}), 404

        # Verify password
        if not check_password_hash(user.password_hash, password):
            return jsonify({"success": False, "message": "Incorrect password"}), 401

        # Log the login
        log_activity(user.id, "logged_in", "user", user.id)

        # Generate token
        payload = {
            "id": user.id,
            "firstname": user.firstname,
            "lastname": user.lastname,
            "email": user.email,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
        
        return jsonify({
            "success": True, 
            "message": "Logged in successfully", 
            "token": token
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500