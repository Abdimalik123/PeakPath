from database import db
from datetime import datetime


class WorkoutProgram(db.Model):
    __tablename__ = 'workout_programs'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    difficulty = db.Column(db.String(50))  # beginner, intermediate, advanced
    duration_weeks = db.Column(db.Integer)
    workouts_per_week = db.Column(db.Integer)
    category = db.Column(db.String(100))  # strength, hypertrophy, endurance, general
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    is_public = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    workouts = db.relationship('ProgramWorkout', back_populates='program', cascade='all, delete-orphan')
    enrollments = db.relationship('ProgramEnrollment', back_populates='program', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'difficulty': self.difficulty,
            'duration_weeks': self.duration_weeks,
            'workouts_per_week': self.workouts_per_week,
            'category': self.category,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ProgramWorkout(db.Model):
    __tablename__ = 'program_workouts'
    
    id = db.Column(db.Integer, primary_key=True)
    program_id = db.Column(db.Integer, db.ForeignKey('workout_programs.id', ondelete='CASCADE'), nullable=False)
    week_number = db.Column(db.Integer, nullable=False)
    day_number = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(200))
    description = db.Column(db.Text)
    
    program = db.relationship('WorkoutProgram', back_populates='workouts')
    exercises = db.relationship('ProgramExercise', back_populates='workout', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'program_id': self.program_id,
            'week_number': self.week_number,
            'day_number': self.day_number,
            'name': self.name,
            'description': self.description,
            'exercises': [e.to_dict() for e in self.exercises]
        }


class ProgramExercise(db.Model):
    __tablename__ = 'program_exercises'
    
    id = db.Column(db.Integer, primary_key=True)
    program_workout_id = db.Column(db.Integer, db.ForeignKey('program_workouts.id', ondelete='CASCADE'), nullable=False)
    exercise_name = db.Column(db.String(200), nullable=False)
    sets = db.Column(db.Integer)
    reps = db.Column(db.String(50))  # Can be "8-12" or "10"
    rest_seconds = db.Column(db.Integer)
    notes = db.Column(db.Text)
    order_index = db.Column(db.Integer)
    progression_type = db.Column(db.String(50))  # linear, percentage, rpe
    progression_amount = db.Column(db.Float)  # 2.5kg per week, 5% per week, etc.
    
    workout = db.relationship('ProgramWorkout', back_populates='exercises')
    
    def to_dict(self):
        return {
            'id': self.id,
            'exercise_name': self.exercise_name,
            'sets': self.sets,
            'reps': self.reps,
            'rest_seconds': self.rest_seconds,
            'notes': self.notes,
            'order_index': self.order_index,
            'progression_type': self.progression_type,
            'progression_amount': self.progression_amount
        }


class ProgramEnrollment(db.Model):
    __tablename__ = 'program_enrollments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    program_id = db.Column(db.Integer, db.ForeignKey('workout_programs.id', ondelete='CASCADE'), nullable=False)
    current_week = db.Column(db.Integer, default=1)
    current_day = db.Column(db.Integer, default=1)
    start_date = db.Column(db.Date)
    status = db.Column(db.String(50), default='active')  # active, completed, paused
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    program = db.relationship('WorkoutProgram', back_populates='enrollments')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'program_id': self.program_id,
            'current_week': self.current_week,
            'current_day': self.current_day,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'status': self.status,
            'enrolled_at': self.enrolled_at.isoformat() if self.enrolled_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
