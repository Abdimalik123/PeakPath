from flask import Blueprint, request, jsonify, g
import functools
from db import get_db, return_db
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from dotenv import load_dotenv
import os
from utils.logging import log_activity

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
auth_bp = Blueprint('auth_bp', __name__)

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


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    firstname = data.get("firstname")
    lastname = data.get("lastname")
    email = data.get("email")
    password = data.get("password")
    confirm_password = data.get("confirm_password")

    # Form validation
    for field_name, field_value in [("firstname", firstname), ("lastname", lastname), ("email", email), ("password", password), ("confirm_password", confirm_password)]:
        if not field_value:
            return jsonify({"success": False, "message": f"Missing {field_name}"}), 400
    if confirm_password != password:
        return jsonify({"success": False, "message": "Passwords do not match"}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"success": False, "message": "User already exists"}), 400

        hashed_password = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO users (firstname, lastname, email, password_hash) VALUES (%s, %s, %s, %s) RETURNING id",
            (firstname, lastname, email, hashed_password)
        )
        user_id = cursor.fetchone()[0]
        conn.commit()

        # Log the creation
        log_activity(user_id, "created", "user", user_id)

        payload = {
            "id": user_id,
            "firstname": firstname,
            "lastname": lastname,
            "email": email,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
        return jsonify({"success": True, "message": "Registered successfully", "user_id": user_id, "token": token}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    if not email:
        return jsonify({"success": False, "message": "Email is required"}), 400
    if not password:
        return jsonify({"success": False, "message": "Password is required"}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, firstname, lastname, email, password_hash FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"success": False, "message": "User does not exist"}), 404

        user_id, firstname, lastname, email, password_hash = user
        if not check_password_hash(password_hash, password):
            return jsonify({"success": False, "message": "Incorrect password"}), 401

        # Log the login
        log_activity(user_id, "logged_in", "user", user_id)

        payload = {
            "id": user_id,
            "firstname": firstname,
            "lastname": lastname,
            "email": email,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
        return jsonify({"success": True, "message": "Logged in successfully", "token": token}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        return_db(conn)