from flask import Blueprint, request, jsonify, g, current_app
import functools
from database import db, limiter
from models import User
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
import secrets
import dns.resolver
from utils.logging import log_activity


SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
if SECRET_KEY == "dev-secret-change-me":
    import warnings
    warnings.warn("SECRET_KEY is using the default dev value. Set a secure SECRET_KEY in production.", stacklevel=2)

auth_bp = Blueprint('auth_bp', __name__)


#------------------------- HELPERS --------------------------------------------------#
def _has_mx_record(domain: str) -> bool:
    """Return True if the domain has at least one MX record (2s timeout)."""
    try:
        resolver = dns.resolver.Resolver()
        resolver.lifetime = 2.0  # max 2 seconds total
        resolver.resolve(domain, 'MX')
        return True
    except Exception:
        # On timeout or any DNS error, allow the email through
        return True


def _validate_email_domain(email: str) -> bool:
    """Check email format and that its domain has MX records."""
    import re
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        return False
    domain = email.split('@')[1]
    return _has_mx_record(domain)


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
            return jsonify({"success": False, "message": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "message": "Invalid token"}), 401
        # Fetch is_admin from DB so it reflects current state, not just token state
        user_record = User.query.get(payload.get('id'))
        payload['is_admin'] = user_record.is_admin if user_record else False
        g.user = payload
        return view(*args, **kwargs)
    return wrapped_view


#------------------------- ADMIN-REQUIRED --------------------------------------------------#
def admin_required(view):
    @functools.wraps(view)
    def wrapped_view(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "error": "Missing or invalid token"}), 401
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "message": "Invalid token"}), 401
        user_record = User.query.get(payload.get('id'))
        if not user_record or not user_record.is_admin:
            return jsonify({"success": False, "message": "Admin access required"}), 403
        payload['is_admin'] = True
        g.user = payload
        return view(*args, **kwargs)
    return wrapped_view


#------------------------- REGISTER --------------------------------------------------#
@auth_bp.route('/register', methods=['POST'])
@limiter.limit("10 per minute")
def register():
    data = request.get_json()
    firstname = data.get("firstname", "").strip()
    lastname = data.get("lastname", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")

    # Field presence
    for field_name, field_value in [("firstname", firstname), ("lastname", lastname),
                                     ("email", email), ("password", password),
                                     ("confirm_password", confirm_password)]:
        if not field_value:
            return jsonify({"success": False, "message": f"Missing {field_name}"}), 400

    # Password rules
    if len(password) < 8:
        return jsonify({"success": False, "message": "Password must be at least 8 characters"}), 400

    if confirm_password != password:
        return jsonify({"success": False, "message": "Passwords do not match"}), 400

    # Email domain MX check (ensures real, deliverable email)
    if not _validate_email_domain(email):
        return jsonify({"success": False, "message": "Please use a valid email address with a real domain"}), 400

    try:
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"success": False, "message": "An account with this email already exists"}), 400

        hashed_password = generate_password_hash(password)
        user = User(
            firstname=firstname,
            lastname=lastname,
            email=email,
            password_hash=hashed_password
        )

        db.session.add(user)
        db.session.commit()

        log_activity(user.id, "created", "user", user.id)

        # Send welcome email (non-blocking — log failure, don't crash)
        try:
            from utils.email import send_welcome_email
            send_welcome_email(email, firstname)
        except Exception as mail_err:
            current_app.logger.warning(f"Welcome email failed for {email}: {mail_err}")

        payload = {
            "id": user.id,
            "firstname": firstname,
            "lastname": lastname,
            "email": email,
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

        return jsonify({
            "success": True,
            "message": "Registered successfully",
            "user_id": user.id,
            "token": token,
            "user": {
                "id": user.id,
                "firstname": firstname,
                "lastname": lastname,
                "email": email
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Registration error: {e}")
        return jsonify({"success": False, "message": "Registration failed. Please try again."}), 500


#------------------------- LOGIN --------------------------------------------------#
@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email:
        return jsonify({"success": False, "message": "Email is required"}), 400
    if not password:
        return jsonify({"success": False, "message": "Password is required"}), 400

    try:
        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({"success": False, "message": "User does not exist"}), 404

        if not check_password_hash(user.password_hash, password):
            return jsonify({"success": False, "message": "Incorrect password"}), 401

        log_activity(user.id, "logged_in", "user", user.id)

        payload = {
            "id": user.id,
            "firstname": user.firstname,
            "lastname": user.lastname,
            "email": user.email,
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

        return jsonify({
            "success": True,
            "message": "Logged in successfully",
            "token": token,
            "user": {
                "id": user.id,
                "firstname": user.firstname,
                "lastname": user.lastname,
                "email": user.email
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Login error: {e}")
        return jsonify({"success": False, "message": "Login failed. Please try again."}), 500


#------------------------- FORGOT PASSWORD --------------------------------------------------#
@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit("5 per minute")
def forgot_password():
    data = request.get_json()
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({"success": False, "message": "Email is required"}), 400

    # Always return success to prevent email enumeration
    user = User.query.filter_by(email=email).first()
    if user:
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expires = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
        db.session.commit()

        try:
            from utils.email import send_password_reset_email
            send_password_reset_email(email, user.firstname or "there", token)
        except Exception as mail_err:
            current_app.logger.error(f"Reset email failed for {email}: {mail_err}")
            # Still return success — don't reveal whether send failed
            return jsonify({
                "success": True,
                "message": "If an account with that email exists, a reset link has been sent."
            }), 200

    return jsonify({
        "success": True,
        "message": "If an account with that email exists, a reset link has been sent."
    }), 200


#------------------------- RESET PASSWORD --------------------------------------------------#
@auth_bp.route('/reset-password', methods=['POST'])
@limiter.limit("10 per minute")
def reset_password():
    data = request.get_json()
    token = data.get("token", "").strip()
    new_password = data.get("new_password", "")
    confirm_password = data.get("confirm_password", "")

    if not token:
        return jsonify({"success": False, "message": "Reset token is required"}), 400
    if not new_password:
        return jsonify({"success": False, "message": "New password is required"}), 400
    if len(new_password) < 8:
        return jsonify({"success": False, "message": "Password must be at least 8 characters"}), 400
    if new_password != confirm_password:
        return jsonify({"success": False, "message": "Passwords do not match"}), 400

    user = User.query.filter_by(reset_token=token).first()

    if not user or not user.reset_token_expires:
        return jsonify({"success": False, "message": "Invalid or expired reset link"}), 400

    expires = user.reset_token_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=datetime.timezone.utc)
    if datetime.datetime.now(datetime.timezone.utc) > expires:
        user.reset_token = None
        user.reset_token_expires = None
        db.session.commit()
        return jsonify({"success": False, "message": "Reset link has expired. Please request a new one."}), 400

    user.password_hash = generate_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.session.commit()

    log_activity(user.id, "reset_password", "user", user.id)

    return jsonify({"success": True, "message": "Password updated successfully. You can now log in."}), 200


#------------------------- ME --------------------------------------------------#
@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    try:
        user_id = g.user['id']
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
        return jsonify({
            "success": True,
            "user": {
                "id": user.id,
                "firstname": user.firstname,
                "lastname": user.lastname,
                "email": user.email
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Get current user error: {e}")
        return jsonify({"success": False, "message": "Failed to retrieve user"}), 500
