# models/__init__.py
# This allows you to import all models from models package
from .user import User
from .user_profile import UserProfile
from .weight_log import WeightLog
from .exercise import Exercise
from .workout import Workout
from .workout_exercise import WorkoutExercise
from .workout_template import WorkoutTemplate
from .template_exercise import TemplateExercise
from .habit import Habit
from .habit_log import HabitLog
from .goal import Goal
from .goal_link import GoalLink
from .nutrition_log import NutritionLog
from .notification import Notification
from .activity_log import ActivityLog
from .user_point import UserPoint
from .user_achievement import UserAchievement
from .point_transaction import PointTransaction

__all__ = [
    'User',
    'UserProfile',
    'WeightLog',
    'Workout',
    'Exercise',
    'WorkoutExercise',
    'WorkoutTemplate',
    'TemplateExercise',
    'Habit',
    'HabitLog',
    'Goal',
    'NutritionLog',
    'Notification',
    'ActivityLog',
    'UserPoint',
    'UserAchievement',
    'PointTransaction',
    'GoalLink'
]