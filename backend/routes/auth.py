from flask import Flask, Blueprint, request, jsonify
from db import conn
from werkzeug.security import generate_password_hash
from .env import SECRET_KEY
import jwt
import datetime

auth_bp = Blueprint('auth_bp', __name__)


@auth_bp.route('/register', methods = ['POST'])
def register():
    data = request.get_json()
    cursor = conn.cursor()
    firstname = data.get("firstname")
    lastname = data.get("lastname")
    email = data.get("email")
    password = data.get("password")
    confirm_password = data.get("confirm_password")

    # Form validation
    if not firstname:
        return jsonify({"success":False, "message": "Missing firstname"})
    if not lastname:
        return jsonify({"success": False, "message": "Missing lastname"})
    if not email:
        return jsonify({"success": False, "message": "Missing email"})
    if not password:
        return jsonify({"success": False, "message": "Missing password"})
    if not confirm_password:
        return jsonify({"success": False, "message": "Confirm password"})
    if confirm_password != password:
        return jsonify({"success": False, "message": "Passwords do not match"})    
    
    try:
        # Check if user already exists
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()
        if existing_user:
            return jsonify({"success": False, "message": "User already exists"})

        # Hash the password and store the new user
        hashed_password = generate_password_hash(password)
        cursor.execute("INSERT INTO users (firstname, lastname, email, password_hash) VALUES (%s, %s, %s, %s)", (firstname, lastname, email, hashed_password))
        conn.commit()
        
        # Generate JWT token
        payload = {
            "firstname": firstname,
            "lastname": lastname,
            "email": email,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

        return jsonify({"success": True, "message": "You have successfully registered", "token": token})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)})
    finally:
        cursor.close()
    

@auth_bp.route('/login', methods = ['POST'])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    # Form validation
    if not email:
        return jsonify({"success": False, "message": "You have to type in your email"})
    if not password:
        return jsonify({"success": False, "message": "You have to type in your password"})
    
    cursor = conn.cursor()
    try:
        # Check if user exists
        cursor.execute("SELECT id, firstname, lastname, email, password_hash FROM users WHERE email = %s" , (email,))
        current_user = cursor.fetchone()
        if not current_user:
            return jsonify({"success": False, "message": "User does not exist"})
    
        user_id, firstname, lastname, email, password_hash = current_user
        # Verify password
        if not check_password_hash(password_hash, password):
            return jsonify({"success": False, "message": "Incorrect password"})
        
        # Generate JWT token
        payload = {
            "id": user_id,
            "firstname": firstname,  # Assuming firstname is the 2nd column
            "lastname": lastname,   # Assuming lastname is the 3rd column
            "email": email,      # Assuming email is the 4th column
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
        return jsonify({"success": True, "message": "You have successfully logged in", "token": token}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
    

