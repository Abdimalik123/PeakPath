from flask import Blueprint, request, jsonify, g, current_app
import functools
from database import db, limiter
from models import User
from models.refresh_token import RefreshToken
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import hashlib
import os
import secrets
import dns.resolver
from utils.logging import log_activity


SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
if SECRET_KEY == "dev-secret-change-me":
    import warnings
    warnings.warn("SECRET_KEY is using the default dev value. Set a secure SECRET_KEY in production.", stacklevel=2)

ACCESS_TOKEN_EXPIRY = datetime.timedelta(hours=1)
REFRESH_TOKEN_EXPIRY = datetime.timedelta(days=30)

auth_bp = Blueprint('auth_bp', __name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _hash_token(raw: str) -> str:
    """SHA-256 hex digest of a raw token string."""
    return hashlib.sha256(raw.encode()).hexdigest()


def _has_mx_record(domain: str) -> bool:
    try:
        resolver = dns.resolver.Resolver()
        resolver.lifetime = 2.0
        resolver.resolve(domain, 'MX')
        return True
    except Exception:
        return True


def _validate_email_domain(email: str) -> bool:
    import re
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        return False
    domain = email.split('@')[1]
    return _has_mx_record(domain)


def _make_access_token(user: "User") -> str:
    payload = {
        "id": user.id,
        "firstname": user.firstname,
        "lastname": user.lastname,
        "email": user.email,
        "token_version": user.token_version,
        "exp": datetime.datetime.now(datetime.timezone.utc) + ACCESS_TOKEN_EXPIRY,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def _make_refresh_token(user: "User") -> str:
    """Create, store, and return a raw refresh token for the user."""
    raw = secrets.token_urlsafe(64)
    token_hash = _hash_token(raw)
    expires_at = datetime.datetime.now(datetime.timezone.utc) + REFRESH_TOKEN_EXPIRY
    rt = RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
    db.session.add(rt)
    return raw


# ---------------------------------------------------------------------------
# Decorators
# ---------------------------------------------------------------------------

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

        user_record = User.query.get(payload.get('id'))
        if not user_record:
            return jsonify({"success": False, "message": "User not found"}), 401

        # Check token hasn't been revoked via logout
        if payload.get('token_version', 0) != user_record.token_version:
            return jsonify({"success": False, "message": "Token has been revoked"}), 401

        payload['is_admin'] = user_record.is_admin
        g.user = payload
        return view(*args, **kwargs)
    return wrapped_view


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


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("10 per minute")
def register():
    data = request.get_json()
    firstname = data.get("firstname", "").strip()
    lastname = data.get("lastname", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")

    for field_name, field_value in [("firstname", firstname), ("lastname", lastname),
                                     ("email", email), ("password", password),
                                     ("confirm_password", confirm_password)]:
        if not field_value:
            return jsonify({"success": False, "message": f"Missing {field_name}"}), 400

    if len(password) < 8:
        return jsonify({"success": False, "message": "Password must be at least 8 characters"}), 400

    if confirm_password != password:
        return jsonify({"success": False, "message": "Passwords do not match"}), 400

    if not _validate_email_domain(email):
        return jsonify({"success": False, "message": "Please use a valid email address with a real domain"}), 400

    try:
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"success": False, "message": "An account with this email already exists"}), 400

        # Generate and hash verification token
        raw_verification = secrets.token_urlsafe(32)
        verification_hash = _hash_token(raw_verification)

        hashed_password = generate_password_hash(password)
        user = User(
            firstname=firstname,
            lastname=lastname,
            email=email,
            password_hash=hashed_password,
            is_verified=False,
            verification_token=verification_hash,
        )
        db.session.add(user)
        db.session.flush()  # get user.id before commit

        access_token = _make_access_token(user)
        raw_refresh = _make_refresh_token(user)
        db.session.commit()

        log_activity(user.id, "registered", "user", user.id)

        # Send verification email (non-blocking)
        try:
            from utils.email import send_verification_email
            send_verification_email(email, firstname, raw_verification)
        except Exception as mail_err:
            current_app.logger.warning(f"Verification email failed for {email}: {mail_err}")

        return jsonify({
            "success": True,
            "message": "Registered successfully. Please check your email to verify your account.",
            "user_id": user.id,
            "access_token": access_token,
            "refresh_token": raw_refresh,
            "token": access_token,  # backward-compat alias
            "is_verified": False,
            "user": {
                "id": user.id,
                "firstname": firstname,
                "lastname": lastname,
                "email": email,
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Registration error: {e}")
        return jsonify({"success": False, "message": "Registration failed. Please try again."}), 500


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

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
            current_app.logger.warning(f"[SECURITY] Login attempt for non-existent email: {email}")
            return jsonify({"success": False, "message": "Invalid email or password"}), 401

        if not check_password_hash(user.password_hash, password):
            current_app.logger.warning(f"[SECURITY] Failed login for user_id={user.id} email={email}")
            return jsonify({"success": False, "message": "Invalid email or password"}), 401

        log_activity(user.id, "logged_in", "user", user.id)

        access_token = _make_access_token(user)
        raw_refresh = _make_refresh_token(user)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Logged in successfully",
            "access_token": access_token,
            "refresh_token": raw_refresh,
            "token": access_token,  # backward-compat alias
            "is_verified": user.is_verified,
            "user": {
                "id": user.id,
                "firstname": user.firstname,
                "lastname": user.lastname,
                "email": user.email,
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Login error: {e}")
        return jsonify({"success": False, "message": "Login failed. Please try again."}), 500


# ---------------------------------------------------------------------------
# Refresh access token
# ---------------------------------------------------------------------------

@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    data = request.get_json() or {}
    raw_token = data.get("refresh_token", "").strip()

    if not raw_token:
        return jsonify({"success": False, "message": "refresh_token is required"}), 400

    token_hash = _hash_token(raw_token)
    rt = RefreshToken.query.filter_by(token_hash=token_hash).first()

    if not rt:
        return jsonify({"success": False, "message": "Invalid refresh token"}), 401

    expires = rt.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=datetime.timezone.utc)
    if datetime.datetime.now(datetime.timezone.utc) > expires:
        db.session.delete(rt)
        db.session.commit()
        return jsonify({"success": False, "message": "Refresh token expired. Please log in again."}), 401

    user = User.query.get(rt.user_id)
    if not user:
        db.session.delete(rt)
        db.session.commit()
        return jsonify({"success": False, "message": "User not found"}), 401

    # Rotate: delete old, issue new refresh token
    db.session.delete(rt)
    new_access = _make_access_token(user)
    new_raw_refresh = _make_refresh_token(user)
    db.session.commit()

    return jsonify({
        "success": True,
        "access_token": new_access,
        "token": new_access,
        "refresh_token": new_raw_refresh,
    }), 200


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    data = request.get_json() or {}
    raw_token = data.get("refresh_token", "").strip()

    try:
        user_id = g.user['id']
        user = User.query.get(user_id)

        # Revoke the specific refresh token if provided
        if raw_token:
            token_hash = _hash_token(raw_token)
            rt = RefreshToken.query.filter_by(token_hash=token_hash, user_id=user_id).first()
            if rt:
                db.session.delete(rt)

        # Increment token_version to invalidate all existing access tokens
        if user:
            user.token_version = (user.token_version or 0) + 1

        db.session.commit()
        log_activity(user_id, "logged_out", "user", user_id)
        return jsonify({"success": True, "message": "Logged out successfully"}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Logout error: {e}")
        return jsonify({"success": False, "message": "Logout failed"}), 500


# ---------------------------------------------------------------------------
# Verify email
# ---------------------------------------------------------------------------

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    data = request.get_json() or {}
    raw_token = data.get("token", "").strip()

    if not raw_token:
        return jsonify({"success": False, "message": "Verification token is required"}), 400

    token_hash = _hash_token(raw_token)
    user = User.query.filter_by(verification_token=token_hash).first()

    if not user:
        return jsonify({"success": False, "message": "Invalid or already-used verification link"}), 400

    user.is_verified = True
    user.verification_token = None
    db.session.commit()

    log_activity(user.id, "verified_email", "user", user.id)
    return jsonify({"success": True, "message": "Email verified successfully. You can now use all features."}), 200


# ---------------------------------------------------------------------------
# Resend verification email
# ---------------------------------------------------------------------------

@auth_bp.route('/resend-verification', methods=['POST'])
@limiter.limit("3 per minute")
@login_required
def resend_verification():
    try:
        user_id = g.user['id']
        user = User.query.get(user_id)

        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        if user.is_verified:
            return jsonify({"success": False, "message": "Email is already verified"}), 400

        raw_verification = secrets.token_urlsafe(32)
        user.verification_token = _hash_token(raw_verification)
        db.session.commit()

        try:
            from utils.email import send_verification_email
            send_verification_email(user.email, user.firstname or "there", raw_verification)
        except Exception as mail_err:
            current_app.logger.warning(f"Resend verification email failed for {user.email}: {mail_err}")

        return jsonify({"success": True, "message": "Verification email sent. Please check your inbox."}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Resend verification error: {e}")
        return jsonify({"success": False, "message": "Failed to resend verification email"}), 500


# ---------------------------------------------------------------------------
# Forgot password
# ---------------------------------------------------------------------------

@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit("5 per minute")
def forgot_password():
    data = request.get_json()
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({"success": False, "message": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()
    if user:
        raw_token = secrets.token_urlsafe(32)
        token_hash = _hash_token(raw_token)
        user.reset_token = token_hash
        user.reset_token_expires = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
        db.session.commit()

        try:
            from utils.email import send_password_reset_email
            send_password_reset_email(email, user.firstname or "there", raw_token)
        except Exception as mail_err:
            current_app.logger.error(f"Reset email failed for {email}: {mail_err}")

    return jsonify({
        "success": True,
        "message": "If an account with that email exists, a reset link has been sent."
    }), 200


# ---------------------------------------------------------------------------
# Reset password
# ---------------------------------------------------------------------------

@auth_bp.route('/reset-password', methods=['POST'])
@limiter.limit("10 per minute")
def reset_password():
    data = request.get_json()
    raw_token = data.get("token", "").strip()
    new_password = data.get("new_password", "")
    confirm_password = data.get("confirm_password", "")

    if not raw_token:
        return jsonify({"success": False, "message": "Reset token is required"}), 400
    if not new_password:
        return jsonify({"success": False, "message": "New password is required"}), 400
    if len(new_password) < 8:
        return jsonify({"success": False, "message": "Password must be at least 8 characters"}), 400
    if new_password != confirm_password:
        return jsonify({"success": False, "message": "Passwords do not match"}), 400

    token_hash = _hash_token(raw_token)
    user = User.query.filter_by(reset_token=token_hash).first()

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
    # Revoke all tokens after password reset
    user.token_version = (user.token_version or 0) + 1
    db.session.commit()

    log_activity(user.id, "reset_password", "user", user.id)
    return jsonify({"success": True, "message": "Password updated successfully. You can now log in."}), 200


# ---------------------------------------------------------------------------
# Me
# ---------------------------------------------------------------------------

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
                "email": user.email,
                "is_verified": user.is_verified,
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Get current user error: {e}")
        return jsonify({"success": False, "message": "Failed to retrieve user"}), 500


@auth_bp.route('/me', methods=['PUT'])
@login_required
def update_current_user():
    try:
        user_id = g.user['id']
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        data = request.get_json()
        from utils.validators import sanitize_text
        firstname = sanitize_text(data.get('firstname', '').strip())
        lastname = sanitize_text(data.get('lastname', '').strip())

        if not firstname:
            return jsonify({"success": False, "message": "First name is required"}), 400

        user.firstname = firstname
        user.lastname = lastname
        db.session.commit()

        return jsonify({
            "success": True,
            "user": {
                "id": user.id,
                "firstname": user.firstname,
                "lastname": user.lastname,
                "email": user.email,
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Update current user error: {e}")
        return jsonify({"success": False, "message": "Failed to update user"}), 500
