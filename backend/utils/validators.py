"""
Input validation schemas using Marshmallow
"""
import re
from marshmallow import Schema, fields, validate, ValidationError, validates_schema, post_load, EXCLUDE
from datetime import datetime


# ---------------------------------------------------------------------------
# XSS / injection sanitisation helpers
# ---------------------------------------------------------------------------

_TAG_RE = re.compile(r'<[^>]+>')
_CONTROL_RE = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]')


def sanitize_text(text: str) -> str:
    """Strip HTML tags and control characters from a string."""
    if not isinstance(text, str):
        return text
    text = _TAG_RE.sub('', text)
    text = _CONTROL_RE.sub('', text)
    return text.strip()


def _sanitize_dict(data):
    """Recursively sanitize all string values in a dict/list."""
    if isinstance(data, dict):
        return {k: _sanitize_dict(v) for k, v in data.items()}
    if isinstance(data, list):
        return [_sanitize_dict(item) for item in data]
    if isinstance(data, str):
        return sanitize_text(data)
    return data


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class WorkoutSchema(Schema):
    type = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    duration = fields.Int(required=True, validate=validate.Range(min=1, max=1440))
    date = fields.Date(required=False, load_default=None)
    notes = fields.Str(allow_none=True, validate=validate.Length(max=500))
    rpe = fields.Int(allow_none=True, validate=validate.Range(min=1, max=10))
    exercises = fields.List(fields.Dict(), required=False)

    class Meta:
        unknown = EXCLUDE

    @post_load
    def sanitize(self, data, **kwargs):
        return _sanitize_dict(data)


class ExerciseSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    sets = fields.Int(allow_none=True, validate=validate.Range(min=0, max=100))
    reps = fields.Int(allow_none=True, validate=validate.Range(min=0, max=1000))
    weight = fields.Float(allow_none=True, validate=validate.Range(min=0, max=1000))
    duration = fields.Int(allow_none=True, validate=validate.Range(min=0, max=1440))
    notes = fields.Str(allow_none=True, validate=validate.Length(max=500))

    @post_load
    def sanitize(self, data, **kwargs):
        return _sanitize_dict(data)


class HabitSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    frequency = fields.Str(required=True, validate=validate.OneOf(['daily', 'weekly', 'monthly']))
    reminder_time = fields.Time(required=True)
    description = fields.Str(required=True, validate=validate.Length(min=1, max=500))
    next_occurrence = fields.Date(required=True)

    @post_load
    def sanitize(self, data, **kwargs):
        return _sanitize_dict(data)


class HabitLogSchema(Schema):
    completed = fields.Bool(required=True)
    amount = fields.Float(allow_none=True, validate=validate.Range(min=0))
    notes = fields.Str(allow_none=True, validate=validate.Length(max=500))
    timestamp = fields.DateTime(allow_none=True)

    @post_load
    def sanitize(self, data, **kwargs):
        return _sanitize_dict(data)


class GoalSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True, validate=validate.Length(max=1000))
    target = fields.Float(required=True, validate=validate.Range(min=0))
    progress = fields.Float(required=False, validate=validate.Range(min=0))
    deadline = fields.Date(allow_none=True)
    category = fields.Str(allow_none=True, validate=validate.Length(max=50))
    auto_sync = fields.Bool(required=False)

    @post_load
    def sanitize(self, data, **kwargs):
        return _sanitize_dict(data)


class GoalLinkSchema(Schema):
    entity_type = fields.Str(required=True, validate=validate.OneOf(['workout', 'habit']))
    entity_id = fields.Int(allow_none=True, validate=validate.Range(min=1))
    linked_workout_type = fields.Str(allow_none=True, validate=validate.Length(max=100))
    contribution_value = fields.Float(required=True, validate=validate.Range(min=0))

    @validates_schema
    def validate_entity(self, data, **kwargs):
        if data['entity_type'] == 'habit' and not data.get('entity_id'):
            raise ValidationError('entity_id is required for habit links')

    @post_load
    def sanitize(self, data, **kwargs):
        return _sanitize_dict(data)


class WeightLogSchema(Schema):
    weight_kg = fields.Float(required=True, validate=validate.Range(min=20, max=500))
    date = fields.Date(required=True)


class UserProfileSchema(Schema):
    age = fields.Int(allow_none=True, validate=validate.Range(min=13, max=120))
    gender = fields.Str(allow_none=True, validate=validate.OneOf(['male', 'female', 'other']))
    height_cm = fields.Float(allow_none=True, validate=validate.Range(min=50, max=300))
    current_weight_kg = fields.Float(allow_none=True, validate=validate.Range(min=20, max=500))
    goal_weight_kg = fields.Float(allow_none=True, validate=validate.Range(min=20, max=500))
    activity_level = fields.Str(allow_none=True, validate=validate.OneOf([
        'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'
    ]))


class PaginationSchema(Schema):
    page = fields.Int(required=False, validate=validate.Range(min=1), load_default=1)
    per_page = fields.Int(required=False, validate=validate.Range(min=1, max=100), load_default=10)


class DateRangeSchema(Schema):
    start_date = fields.Date(required=False)
    end_date = fields.Date(required=False)

    @validates_schema
    def validate_date_range(self, data, **kwargs):
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] > data['end_date']:
                raise ValidationError('start_date must be before end_date')


class GroupSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    description = fields.Str(allow_none=True, validate=validate.Length(max=500))
    is_public = fields.Bool(required=False, load_default=True)
    category = fields.Str(allow_none=True, validate=validate.Length(max=50))

    class Meta:
        unknown = EXCLUDE

    @post_load
    def sanitize(self, data, **kwargs):
        return _sanitize_dict(data)


class GroupPostSchema(Schema):
    content = fields.Str(required=True, validate=validate.Length(min=1, max=2000))

    class Meta:
        unknown = EXCLUDE

    @post_load
    def sanitize(self, data, **kwargs):
        return _sanitize_dict(data)


class MessageSchema(Schema):
    content = fields.Str(required=True, validate=validate.Length(min=1, max=2000))

    class Meta:
        unknown = EXCLUDE

    @post_load
    def sanitize(self, data, **kwargs):
        return _sanitize_dict(data)


class CommentSchema(Schema):
    comment = fields.Str(required=True, validate=validate.Length(min=1, max=1000))

    class Meta:
        unknown = EXCLUDE

    @post_load
    def sanitize(self, data, **kwargs):
        return _sanitize_dict(data)


class ChallengeSchema(Schema):
    challenge_type = fields.Str(required=True, validate=validate.OneOf([
        'workout_count', 'total_volume', 'specific_exercise', 'streak'
    ]))
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True, validate=validate.Length(max=1000))
    target_value = fields.Float(required=True, validate=validate.Range(min=0.01))
    duration_days = fields.Int(required=True, validate=validate.Range(min=1, max=365))
    is_public = fields.Bool(required=False, load_default=False)
    target_exercise_id = fields.Int(allow_none=True)
    invited_users = fields.List(fields.Int(), required=False, load_default=[])

    class Meta:
        unknown = EXCLUDE

    @post_load
    def sanitize(self, data, **kwargs):
        return _sanitize_dict(data)


class CardioSchema(Schema):
    cardio_type = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    distance = fields.Float(allow_none=True, validate=validate.Range(min=0, max=1000))
    duration = fields.Int(allow_none=True, validate=validate.Range(min=1, max=1440))
    pace = fields.Float(allow_none=True, validate=validate.Range(min=0))
    calories = fields.Int(allow_none=True, validate=validate.Range(min=0, max=10000))
    heart_rate_avg = fields.Int(allow_none=True, validate=validate.Range(min=30, max=250))
    heart_rate_max = fields.Int(allow_none=True, validate=validate.Range(min=30, max=250))
    elevation_gain = fields.Float(allow_none=True, validate=validate.Range(min=0))
    notes = fields.Str(allow_none=True, validate=validate.Length(max=500))
    date = fields.Str(allow_none=True)

    class Meta:
        unknown = EXCLUDE

    @post_load
    def sanitize(self, data, **kwargs):
        return _sanitize_dict(data)


class BodyMeasurementSchema(Schema):
    weight_kg = fields.Float(required=True, validate=validate.Range(min=20, max=500))
    measured_at = fields.Date(required=False, allow_none=True)
    chest = fields.Float(allow_none=True, validate=validate.Range(min=0, max=300))
    waist = fields.Float(allow_none=True, validate=validate.Range(min=0, max=300))
    hips = fields.Float(allow_none=True, validate=validate.Range(min=0, max=300))
    bicep_left = fields.Float(allow_none=True, validate=validate.Range(min=0, max=100))
    bicep_right = fields.Float(allow_none=True, validate=validate.Range(min=0, max=100))
    thigh_left = fields.Float(allow_none=True, validate=validate.Range(min=0, max=150))
    thigh_right = fields.Float(allow_none=True, validate=validate.Range(min=0, max=150))
    calf_left = fields.Float(allow_none=True, validate=validate.Range(min=0, max=100))
    calf_right = fields.Float(allow_none=True, validate=validate.Range(min=0, max=100))
    neck = fields.Float(allow_none=True, validate=validate.Range(min=0, max=100))
    shoulders = fields.Float(allow_none=True, validate=validate.Range(min=0, max=300))
    body_fat_percentage = fields.Float(allow_none=True, validate=validate.Range(min=0, max=70))
    notes = fields.Str(allow_none=True, validate=validate.Length(max=500))

    class Meta:
        unknown = EXCLUDE

    @post_load
    def sanitize(self, data, **kwargs):
        return _sanitize_dict(data)


# ---------------------------------------------------------------------------
# Decorator helpers
# ---------------------------------------------------------------------------

def validate_request(schema_class):
    from functools import wraps
    from flask import request, jsonify

    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            schema = schema_class()
            try:
                validated_data = schema.load(request.get_json() or {})
                request.validated_data = validated_data
                return f(*args, **kwargs)
            except ValidationError as err:
                return jsonify({
                    "success": False,
                    "message": "Validation error",
                    "errors": err.messages
                }), 400
        return wrapper
    return decorator


def validate_query_params(schema_class):
    from functools import wraps
    from flask import request, jsonify

    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            schema = schema_class()
            try:
                validated_params = schema.load(request.args.to_dict())
                request.validated_params = validated_params
                return f(*args, **kwargs)
            except ValidationError as err:
                return jsonify({
                    "success": False,
                    "message": "Validation error",
                    "errors": err.messages
                }), 400
        return wrapper
    return decorator
