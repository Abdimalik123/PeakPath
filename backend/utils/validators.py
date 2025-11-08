"""
Input validation schemas using Marshmallow
"""
from marshmallow import Schema, fields, validate, ValidationError, validates_schema
from datetime import datetime


class WorkoutSchema(Schema):
    """Validation schema for workout creation"""
    type = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    duration = fields.Int(required=True, validate=validate.Range(min=1, max=1440))  # Max 24 hours
    date = fields.Date(required=True)
    notes = fields.Str(allow_none=True, validate=validate.Length(max=500))
    exercises = fields.List(fields.Dict(), required=False)


class ExerciseSchema(Schema):
    """Validation schema for exercise in workout"""
    name = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    sets = fields.Int(allow_none=True, validate=validate.Range(min=0, max=100))
    reps = fields.Int(allow_none=True, validate=validate.Range(min=0, max=1000))
    weight = fields.Float(allow_none=True, validate=validate.Range(min=0, max=1000))
    duration = fields.Int(allow_none=True, validate=validate.Range(min=0, max=1440))
    notes = fields.Str(allow_none=True, validate=validate.Length(max=500))


class HabitSchema(Schema):
    """Validation schema for habit creation"""
    name = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    frequency = fields.Str(required=True, validate=validate.OneOf(['daily', 'weekly', 'monthly']))
    reminder_time = fields.Time(required=True)
    description = fields.Str(required=True, validate=validate.Length(min=1, max=500))
    next_occurrence = fields.Date(required=True)


class HabitLogSchema(Schema):
    """Validation schema for habit logging"""
    completed = fields.Bool(required=True)
    amount = fields.Float(allow_none=True, validate=validate.Range(min=0))
    notes = fields.Str(allow_none=True, validate=validate.Length(max=500))
    timestamp = fields.DateTime(allow_none=True)


class GoalSchema(Schema):
    """Validation schema for goal creation"""
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True, validate=validate.Length(max=1000))
    target = fields.Float(required=True, validate=validate.Range(min=0))
    progress = fields.Float(required=False, validate=validate.Range(min=0))
    deadline = fields.Date(allow_none=True)
    category = fields.Str(allow_none=True, validate=validate.Length(max=50))
    auto_sync = fields.Bool(required=False)


class GoalLinkSchema(Schema):
    """Validation schema for goal linking"""
    entity_type = fields.Str(required=True, validate=validate.OneOf(['workout', 'habit']))
    entity_id = fields.Int(allow_none=True, validate=validate.Range(min=1))
    linked_workout_type = fields.Str(allow_none=True, validate=validate.Length(max=100))
    contribution_value = fields.Float(required=True, validate=validate.Range(min=0))

    @validates_schema
    def validate_entity(self, data, **kwargs):
        """Ensure entity_id is provided for habits"""
        if data['entity_type'] == 'habit' and not data.get('entity_id'):
            raise ValidationError('entity_id is required for habit links')


class WeightLogSchema(Schema):
    """Validation schema for weight logging"""
    weight_kg = fields.Float(required=True, validate=validate.Range(min=20, max=500))
    date = fields.Date(required=True)


class UserProfileSchema(Schema):
    """Validation schema for user profile"""
    age = fields.Int(allow_none=True, validate=validate.Range(min=13, max=120))
    gender = fields.Str(allow_none=True, validate=validate.OneOf(['male', 'female', 'other']))
    height_cm = fields.Float(allow_none=True, validate=validate.Range(min=50, max=300))
    current_weight_kg = fields.Float(allow_none=True, validate=validate.Range(min=20, max=500))
    goal_weight_kg = fields.Float(allow_none=True, validate=validate.Range(min=20, max=500))
    activity_level = fields.Str(allow_none=True, validate=validate.OneOf([
        'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'
    ]))


class PaginationSchema(Schema):
    """Validation schema for pagination parameters"""
    page = fields.Int(required=False, validate=validate.Range(min=1), load_default=1)
    per_page = fields.Int(required=False, validate=validate.Range(min=1, max=100), load_default=10)


class DateRangeSchema(Schema):
    """Validation schema for date range filtering"""
    start_date = fields.Date(required=False)
    end_date = fields.Date(required=False)

    @validates_schema
    def validate_date_range(self, data, **kwargs):
        """Ensure start_date is before end_date"""
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] > data['end_date']:
                raise ValidationError('start_date must be before end_date')


def validate_request(schema_class):
    """
    Decorator to validate request data against a schema
    
    Usage:
        @validate_request(WorkoutSchema)
        def create_workout():
            data = request.validated_data
            ...
    """
    from functools import wraps
    from flask import request, jsonify
    
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            schema = schema_class()
            try:
                # Validate and load data
                validated_data = schema.load(request.get_json() or {})
                # Attach validated data to request object
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
    """
    Decorator to validate query parameters against a schema
    
    Usage:
        @validate_query_params(PaginationSchema)
        def get_workouts():
            params = request.validated_params
            ...
    """
    from functools import wraps
    from flask import request, jsonify
    
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            schema = schema_class()
            try:
                # Validate and load query parameters
                validated_params = schema.load(request.args.to_dict())
                # Attach validated params to request object
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
