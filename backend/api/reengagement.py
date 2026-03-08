from flask import Blueprint, jsonify, g, current_app
from database import db
from models import Workout, HabitLog, Goal, UserPoint, PointTransaction, Habit
from models.cardio_workout import CardioWorkout
from models.streak_freeze import StreakFreeze
from api.auth import login_required
from datetime import datetime, timedelta
from sqlalchemy import func

reengagement_bp = Blueprint('reengagement_bp', __name__)

STREAK_FREEZE_POINTS_COST = 50
MAX_FREEZES_PER_WEEK = 1


@reengagement_bp.route('/streak/status', methods=['GET'])
@login_required
def get_streak_status():
    """Get current streak info with freeze availability."""
    try:
        user_id = g.user['id']
        today = datetime.now().date()
        week_ago = today - timedelta(days=7)

        # Calculate current streak
        streak = _calculate_streak_with_freezes(user_id)

        # Check freezes used this week
        freezes_this_week = StreakFreeze.query.filter(
            StreakFreeze.user_id == user_id,
            StreakFreeze.freeze_date >= week_ago
        ).count()

        can_freeze = freezes_this_week < MAX_FREEZES_PER_WEEK

        # Check if today needs a freeze (no workout today, streak at risk)
        has_workout_today = Workout.query.filter(
            Workout.user_id == user_id,
            Workout.date == today
        ).first() is not None

        has_cardio_today = CardioWorkout.query.filter(
            CardioWorkout.user_id == user_id,
            func.date(CardioWorkout.date) == today
        ).first() is not None

        streak_at_risk = not has_workout_today and not has_cardio_today and streak > 0

        # Get user points for cost check
        user_points = UserPoint.query.filter_by(user_id=user_id).first()
        can_afford = (user_points.total_points if user_points else 0) >= STREAK_FREEZE_POINTS_COST

        return jsonify({
            'success': True,
            'streak': streak,
            'streak_at_risk': streak_at_risk,
            'can_freeze': can_freeze,
            'can_afford_freeze': can_afford,
            'freeze_cost': STREAK_FREEZE_POINTS_COST,
            'freezes_used_this_week': freezes_this_week,
            'max_freezes_per_week': MAX_FREEZES_PER_WEEK,
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error getting streak status: {e}")
        return jsonify({'success': False, 'message': 'Failed to get streak status'}), 500


@reengagement_bp.route('/streak/freeze', methods=['POST'])
@login_required
def use_streak_freeze():
    """Use a streak freeze for today."""
    try:
        user_id = g.user['id']
        today = datetime.now().date()
        week_ago = today - timedelta(days=7)

        # Check if already frozen today
        existing = StreakFreeze.query.filter_by(
            user_id=user_id, freeze_date=today
        ).first()
        if existing:
            return jsonify({'success': False, 'message': 'Already used a freeze today'}), 400

        # Check weekly limit
        freezes_this_week = StreakFreeze.query.filter(
            StreakFreeze.user_id == user_id,
            StreakFreeze.freeze_date >= week_ago
        ).count()
        if freezes_this_week >= MAX_FREEZES_PER_WEEK:
            return jsonify({'success': False, 'message': 'Weekly freeze limit reached'}), 400

        # Deduct points
        user_points = UserPoint.query.filter_by(user_id=user_id).first()
        if not user_points or user_points.total_points < STREAK_FREEZE_POINTS_COST:
            return jsonify({'success': False, 'message': 'Not enough points'}), 400

        user_points.total_points -= STREAK_FREEZE_POINTS_COST

        # Record the freeze
        freeze = StreakFreeze(
            user_id=user_id,
            freeze_date=today,
            freeze_type='points',
            points_cost=STREAK_FREEZE_POINTS_COST,
        )
        db.session.add(freeze)

        # Record point transaction
        transaction = PointTransaction(
            user_id=user_id,
            points=-STREAK_FREEZE_POINTS_COST,
            reason='streak_freeze',
            entity_type='streak_freeze',
            entity_id=None,
        )
        db.session.add(transaction)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Streak freeze activated!',
            'points_remaining': user_points.total_points,
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error using streak freeze: {e}")
        return jsonify({'success': False, 'message': 'Failed to use freeze'}), 500


@reengagement_bp.route('/weekly-recap', methods=['GET'])
@login_required
def get_weekly_recap():
    """Get a week-over-week comparison recap."""
    try:
        user_id = g.user['id']
        today = datetime.now().date()

        this_week_start = today - timedelta(days=7)
        last_week_start = today - timedelta(days=14)

        def week_stats(start, end):
            workouts = Workout.query.filter(
                Workout.user_id == user_id,
                Workout.date >= start,
                Workout.date < end
            ).all()

            cardio = CardioWorkout.query.filter(
                CardioWorkout.user_id == user_id,
                func.date(CardioWorkout.date) >= start,
                func.date(CardioWorkout.date) < end
            ).all()

            total_workouts = len(workouts) + len(cardio)
            total_duration = sum(w.duration or 0 for w in workouts) + sum(c.duration or 0 for c in cardio)

            habits_completed = HabitLog.query.join(HabitLog.habit).filter(
                HabitLog.habit.has(user_id=user_id),
                HabitLog.completed == True,
                HabitLog.timestamp >= start,
                HabitLog.timestamp < end
            ).count()

            goals_completed = Goal.query.filter(
                Goal.user_id == user_id,
                Goal.progress >= Goal.target,
                Goal.updated_at >= start,
                Goal.updated_at < end
            ).count()

            points = db.session.query(
                func.coalesce(func.sum(PointTransaction.points), 0)
            ).filter(
                PointTransaction.user_id == user_id,
                PointTransaction.created_at >= start,
                PointTransaction.created_at < end
            ).scalar() or 0

            # Calculate total volume from workouts
            from models import WorkoutExercise
            total_volume = 0
            for w in workouts:
                exercises = WorkoutExercise.query.filter_by(workout_id=w.id).all()
                for ex in exercises:
                    if ex.weight and ex.reps and ex.sets:
                        total_volume += float(ex.weight) * ex.reps * ex.sets

            return {
                'workouts': total_workouts,
                'duration_minutes': total_duration,
                'habits_completed': habits_completed,
                'goals_completed': goals_completed,
                'points_earned': int(points),
                'total_volume': round(total_volume, 1),
            }

        this_week = week_stats(this_week_start, today)
        last_week = week_stats(last_week_start, this_week_start)

        def calc_change(current, previous):
            if previous == 0:
                return 100 if current > 0 else 0
            return round(((current - previous) / previous) * 100)

        changes = {}
        for key in this_week:
            changes[key] = calc_change(this_week[key], last_week[key])

        # Find most active day this week
        workout_days = {}
        workouts_this_week = Workout.query.filter(
            Workout.user_id == user_id,
            Workout.date >= this_week_start,
            Workout.date < today
        ).all()
        for w in workouts_this_week:
            day = w.date.strftime('%A')
            workout_days[day] = workout_days.get(day, 0) + 1
        most_active_day = max(workout_days, key=workout_days.get) if workout_days else None

        # Streak info
        from api.analytics import _calculate_workout_streak
        streak = _calculate_workout_streak(user_id)

        return jsonify({
            'success': True,
            'this_week': this_week,
            'last_week': last_week,
            'changes': changes,
            'most_active_day': most_active_day,
            'current_streak': streak,
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error generating weekly recap: {e}")
        return jsonify({'success': False, 'message': 'Failed to generate recap'}), 500


@reengagement_bp.route('/comeback-status', methods=['GET'])
@login_required
def get_comeback_status():
    """Check if user has been inactive and offer comeback incentive."""
    try:
        user_id = g.user['id']
        today = datetime.now().date()

        # Find last workout date
        last_workout = Workout.query.filter_by(user_id=user_id).order_by(
            Workout.date.desc()
        ).first()

        last_cardio = CardioWorkout.query.filter_by(user_id=user_id).order_by(
            CardioWorkout.date.desc()
        ).first()

        last_active = None
        if last_workout:
            last_active = last_workout.date
        if last_cardio:
            cardio_date = last_cardio.date.date() if hasattr(last_cardio.date, 'date') else last_cardio.date
            if not last_active or cardio_date > last_active:
                last_active = cardio_date

        if not last_active:
            return jsonify({
                'success': True,
                'is_comeback': False,
                'days_inactive': 0,
                'message': None,
            }), 200

        days_inactive = (today - last_active).days

        is_comeback = days_inactive >= 3
        bonus_points = 0
        message = None

        if days_inactive >= 7:
            bonus_points = 50
            message = "Welcome back! Complete a workout today for 50 bonus points."
        elif days_inactive >= 3:
            bonus_points = 25
            message = "We missed you! Complete a workout today for 25 bonus points."

        return jsonify({
            'success': True,
            'is_comeback': is_comeback,
            'days_inactive': days_inactive,
            'bonus_points': bonus_points,
            'message': message,
            'last_active': last_active.isoformat() if last_active else None,
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error checking comeback status: {e}")
        return jsonify({'success': False, 'message': 'Failed to check status'}), 500


def _calculate_streak_with_freezes(user_id):
    """Calculate workout streak accounting for freeze days."""
    try:
        today = datetime.now().date()
        streak = 0
        current_date = today

        while True:
            workout_exists = Workout.query.filter(
                Workout.user_id == user_id,
                Workout.date == current_date
            ).first()

            cardio_exists = CardioWorkout.query.filter(
                CardioWorkout.user_id == user_id,
                func.date(CardioWorkout.date) == current_date
            ).first()

            freeze_exists = StreakFreeze.query.filter_by(
                user_id=user_id, freeze_date=current_date
            ).first()

            if workout_exists or cardio_exists or freeze_exists:
                streak += 1
                current_date -= timedelta(days=1)
            else:
                break

            if streak > 365:
                break

        return streak
    except Exception:
        return 0
