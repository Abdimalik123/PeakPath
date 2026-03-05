"""
Seed script to populate starter workout programs.
Run: python seed_programs.py
"""
from app import create_app
from database import db
from models.workout_program import WorkoutProgram, ProgramWorkout, ProgramExercise


# Helper: 'compound' or 'isolation' determines rest and progression
COMPOUND = "compound"
ISOLATION = "isolation"


def ex(name, sets, reps, ex_type, order, notes=None):
    """Build an exercise dict."""
    return {
        "exercise_name": name,
        "sets": sets,
        "reps": reps,
        "rest_seconds": 90 if ex_type == COMPOUND else 60,
        "notes": notes,
        "order_index": order,
        "progression_type": "linear",
        "progression_amount": 2.5 if ex_type == COMPOUND else 1.25,
    }


PROGRAMS = [
    # ----------------------------------------------------------------
    # 1. Beginner Strength
    # ----------------------------------------------------------------
    {
        "program": {
            "name": "Beginner Strength",
            "description": "A simple full-body program for beginners, training 3 days per week with compound movements to build a solid foundation.",
            "difficulty": "beginner",
            "duration_weeks": 8,
            "workouts_per_week": 3,
            "category": "strength",
        },
        "workouts": [
            {
                "week_number": 1,
                "day_number": 1,
                "name": "Full Body A",
                "description": "Squat-focused full body session",
                "exercises": [
                    ex("Squat", 3, "8-10", COMPOUND, 1),
                    ex("Bench Press", 3, "8-10", COMPOUND, 2),
                    ex("Barbell Row", 3, "8-10", COMPOUND, 3),
                    ex("Overhead Press", 3, "8-10", COMPOUND, 4),
                    ex("Plank", 3, "30s", ISOLATION, 5),
                ],
            },
            {
                "week_number": 1,
                "day_number": 2,
                "name": "Full Body B",
                "description": "Deadlift-focused full body session",
                "exercises": [
                    ex("Deadlift", 3, "5", COMPOUND, 1),
                    ex("Dumbbell Bench Press", 3, "10-12", COMPOUND, 2),
                    ex("Lat Pulldown", 3, "10-12", ISOLATION, 3),
                    ex("Lunges", 3, "10", COMPOUND, 4),
                    ex("Crunches", 3, "15", ISOLATION, 5),
                ],
            },
            {
                "week_number": 1,
                "day_number": 3,
                "name": "Full Body C",
                "description": "Balanced full body session",
                "exercises": [
                    ex("Squat", 3, "8-10", COMPOUND, 1),
                    ex("Dumbbell Shoulder Press", 3, "10-12", COMPOUND, 2),
                    ex("Seated Cable Row", 3, "10-12", COMPOUND, 3),
                    ex("Leg Curl", 3, "12", ISOLATION, 4),
                    ex("Russian Twist", 3, "12", ISOLATION, 5),
                ],
            },
        ],
    },
    # ----------------------------------------------------------------
    # 2. Push Pull Legs
    # ----------------------------------------------------------------
    {
        "program": {
            "name": "Push Pull Legs",
            "description": "A classic 6-day push/pull/legs split for intermediate lifters looking to maximise volume and muscle growth.",
            "difficulty": "intermediate",
            "duration_weeks": 8,
            "workouts_per_week": 6,
            "category": "hypertrophy",
        },
        "workouts": [
            {
                "week_number": 1,
                "day_number": 1,
                "name": "Push",
                "description": "Chest, shoulders, and triceps",
                "exercises": [
                    ex("Bench Press", 4, "6-8", COMPOUND, 1),
                    ex("Overhead Press", 3, "8-10", COMPOUND, 2),
                    ex("Incline Dumbbell Press", 3, "10-12", COMPOUND, 3),
                    ex("Lateral Raises", 3, "12-15", ISOLATION, 4),
                    ex("Tricep Pushdown", 3, "12-15", ISOLATION, 5),
                ],
            },
            {
                "week_number": 1,
                "day_number": 2,
                "name": "Pull",
                "description": "Back and biceps",
                "exercises": [
                    ex("Deadlift", 3, "5", COMPOUND, 1),
                    ex("Barbell Row", 4, "6-8", COMPOUND, 2),
                    ex("Pull-ups", 3, "AMRAP", COMPOUND, 3),
                    ex("Face Pulls", 3, "15", ISOLATION, 4),
                    ex("Barbell Curl", 3, "10-12", ISOLATION, 5),
                ],
            },
            {
                "week_number": 1,
                "day_number": 3,
                "name": "Legs",
                "description": "Quads, hamstrings, and calves",
                "exercises": [
                    ex("Squat", 4, "6-8", COMPOUND, 1),
                    ex("Romanian Deadlift", 3, "8-10", COMPOUND, 2),
                    ex("Leg Press", 3, "10-12", COMPOUND, 3),
                    ex("Leg Curl", 3, "12", ISOLATION, 4),
                    ex("Calf Raises", 4, "15", ISOLATION, 5),
                ],
            },
        ],
    },
    # ----------------------------------------------------------------
    # 3. Upper Lower Split
    # ----------------------------------------------------------------
    {
        "program": {
            "name": "Upper Lower Split",
            "description": "A balanced 4-day upper/lower split that hits each muscle group twice per week with a mix of strength and hypertrophy work.",
            "difficulty": "intermediate",
            "duration_weeks": 8,
            "workouts_per_week": 4,
            "category": "strength",
        },
        "workouts": [
            {
                "week_number": 1,
                "day_number": 1,
                "name": "Upper A",
                "description": "Heavy upper body - pressing focus",
                "exercises": [
                    ex("Bench Press", 4, "6-8", COMPOUND, 1),
                    ex("Barbell Row", 4, "6-8", COMPOUND, 2),
                    ex("Overhead Press", 3, "8-10", COMPOUND, 3),
                    ex("Dumbbell Curl", 3, "10-12", ISOLATION, 4),
                    ex("Skull Crushers", 3, "10-12", ISOLATION, 5),
                ],
            },
            {
                "week_number": 1,
                "day_number": 2,
                "name": "Lower A",
                "description": "Heavy lower body - squat focus",
                "exercises": [
                    ex("Squat", 4, "6-8", COMPOUND, 1),
                    ex("Romanian Deadlift", 3, "8-10", COMPOUND, 2),
                    ex("Leg Press", 3, "10-12", COMPOUND, 3),
                    ex("Leg Curl", 3, "12", ISOLATION, 4),
                    ex("Calf Raises", 4, "15", ISOLATION, 5),
                ],
            },
            {
                "week_number": 1,
                "day_number": 3,
                "name": "Upper B",
                "description": "Hypertrophy upper body",
                "exercises": [
                    ex("Dumbbell Bench Press", 3, "10-12", COMPOUND, 1),
                    ex("Pull-ups", 3, "AMRAP", COMPOUND, 2),
                    ex("Lateral Raises", 3, "12-15", ISOLATION, 3),
                    ex("Hammer Curl", 3, "12", ISOLATION, 4),
                    ex("Tricep Pushdown", 3, "12-15", ISOLATION, 5),
                ],
            },
            {
                "week_number": 1,
                "day_number": 4,
                "name": "Lower B",
                "description": "Hypertrophy lower body",
                "exercises": [
                    ex("Front Squat", 3, "8-10", COMPOUND, 1),
                    ex("Hip Thrust", 3, "10-12", COMPOUND, 2),
                    ex("Leg Extension", 3, "12", ISOLATION, 3),
                    ex("Lunges", 3, "10", COMPOUND, 4),
                    ex("Calf Raises", 3, "15", ISOLATION, 5),
                ],
            },
        ],
    },
    # ----------------------------------------------------------------
    # 4. 5x5 Strength
    # ----------------------------------------------------------------
    {
        "program": {
            "name": "5x5 Strength",
            "description": "A minimalist barbell program focused purely on progressive overload with the big compound lifts. Alternate Workout A and B each session.",
            "difficulty": "beginner",
            "duration_weeks": 12,
            "workouts_per_week": 3,
            "category": "strength",
        },
        "workouts": [
            {
                "week_number": 1,
                "day_number": 1,
                "name": "Workout A",
                "description": "Squat, Bench Press, Barbell Row",
                "exercises": [
                    ex("Squat", 5, "5", COMPOUND, 1),
                    ex("Bench Press", 5, "5", COMPOUND, 2),
                    ex("Barbell Row", 5, "5", COMPOUND, 3),
                ],
            },
            {
                "week_number": 1,
                "day_number": 2,
                "name": "Workout B",
                "description": "Squat, Overhead Press, Deadlift",
                "exercises": [
                    ex("Squat", 5, "5", COMPOUND, 1),
                    ex("Overhead Press", 5, "5", COMPOUND, 2),
                    ex("Deadlift", 1, "5", COMPOUND, 3),
                ],
            },
        ],
    },
]


def seed():
    app = create_app()
    with app.app_context():
        added = 0
        skipped = 0

        for data in PROGRAMS:
            prog_info = data["program"]

            # Check if program already exists by name
            exists = WorkoutProgram.query.filter(
                db.func.lower(WorkoutProgram.name) == prog_info["name"].lower()
            ).first()
            if exists:
                skipped += 1
                print(f"  Skipped: {prog_info['name']} (already exists)")
                continue

            # Create the program
            program = WorkoutProgram(
                name=prog_info["name"],
                description=prog_info["description"],
                difficulty=prog_info["difficulty"],
                duration_weeks=prog_info["duration_weeks"],
                workouts_per_week=prog_info["workouts_per_week"],
                category=prog_info["category"],
                created_by=1,
                is_public=True,
            )
            db.session.add(program)
            db.session.flush()  # get program.id

            # Create workouts and exercises
            for wo_data in data["workouts"]:
                workout = ProgramWorkout(
                    program_id=program.id,
                    week_number=wo_data["week_number"],
                    day_number=wo_data["day_number"],
                    name=wo_data["name"],
                    description=wo_data["description"],
                )
                db.session.add(workout)
                db.session.flush()  # get workout.id

                for ex_data in wo_data["exercises"]:
                    exercise = ProgramExercise(
                        program_workout_id=workout.id,
                        exercise_name=ex_data["exercise_name"],
                        sets=ex_data["sets"],
                        reps=ex_data["reps"],
                        rest_seconds=ex_data["rest_seconds"],
                        notes=ex_data["notes"],
                        order_index=ex_data["order_index"],
                        progression_type=ex_data["progression_type"],
                        progression_amount=ex_data["progression_amount"],
                    )
                    db.session.add(exercise)

            added += 1
            print(f"  Added: {prog_info['name']}")

        db.session.commit()
        print(f"\nSeeded {added} programs ({skipped} already existed)")


if __name__ == "__main__":
    seed()
