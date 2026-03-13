"""
Seed script for system workout templates.

Run from the backend directory:
    python scripts/seed_system_templates.py

Idempotent: skips templates that already exist by name.
Skips exercises not found in the DB (prints a warning).
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from database import db
from models import WorkoutTemplate, TemplateExercise, Exercise
from sqlalchemy import func
from datetime import datetime


SYSTEM_TEMPLATES = [
    {
        "name": "Push Day",
        "description": "Chest, shoulders, and triceps focused session",
        "category": "Strength",
        "difficulty": "intermediate",
        "duration_minutes": 55,
        "exercises": [
            {"name": "Bench Press", "sets": 4, "reps": "8-10"},
            {"name": "Overhead Press", "sets": 3, "reps": "8-10"},
            {"name": "Incline Dumbbell Press", "sets": 3, "reps": "10-12"},
            {"name": "Lateral Raise", "sets": 3, "reps": "15"},
            {"name": "Tricep Pushdown", "sets": 3, "reps": "12"},
            {"name": "Overhead Tricep Extension", "sets": 3, "reps": "12"},
        ],
    },
    {
        "name": "Pull Day",
        "description": "Back and biceps for a strong posterior chain",
        "category": "Strength",
        "difficulty": "intermediate",
        "duration_minutes": 55,
        "exercises": [
            {"name": "Deadlift", "sets": 4, "reps": "5-6"},
            {"name": "Pull-Up", "sets": 3, "reps": "8-12"},
            {"name": "Barbell Row", "sets": 4, "reps": "8-10"},
            {"name": "Face Pull", "sets": 3, "reps": "15-20"},
            {"name": "Barbell Curl", "sets": 3, "reps": "10-12"},
            {"name": "Hammer Curl", "sets": 3, "reps": "10-12"},
        ],
    },
    {
        "name": "Leg Day",
        "description": "Quads, hamstrings, glutes, and calves",
        "category": "Strength",
        "difficulty": "intermediate",
        "duration_minutes": 60,
        "exercises": [
            {"name": "Squat", "sets": 4, "reps": "6-8"},
            {"name": "Romanian Deadlift", "sets": 3, "reps": "8-10"},
            {"name": "Leg Press", "sets": 3, "reps": "10-12"},
            {"name": "Walking Lunge", "sets": 3, "reps": "12"},
            {"name": "Lying Leg Curl", "sets": 3, "reps": "12-15"},
            {"name": "Standing Calf Raise", "sets": 4, "reps": "15-20"},
        ],
    },
    {
        "name": "Upper Body",
        "description": "Complete upper body in one session",
        "category": "Strength",
        "difficulty": "beginner",
        "duration_minutes": 50,
        "exercises": [
            {"name": "Bench Press", "sets": 3, "reps": "8-10"},
            {"name": "Barbell Row", "sets": 3, "reps": "8-10"},
            {"name": "Overhead Press", "sets": 3, "reps": "10-12"},
            {"name": "Lat Pulldown", "sets": 3, "reps": "10-12"},
            {"name": "Dumbbell Curl", "sets": 2, "reps": "12-15"},
            {"name": "Tricep Dip", "sets": 2, "reps": "10-12"},
        ],
    },
    {
        "name": "Full Body Strength",
        "description": "Hit every muscle group — perfect for 3x/week training",
        "category": "Strength",
        "difficulty": "beginner",
        "duration_minutes": 60,
        "exercises": [
            {"name": "Squat", "sets": 3, "reps": "8-10"},
            {"name": "Bench Press", "sets": 3, "reps": "8-10"},
            {"name": "Barbell Row", "sets": 3, "reps": "8-10"},
            {"name": "Overhead Press", "sets": 3, "reps": "8-10"},
            {"name": "Romanian Deadlift", "sets": 3, "reps": "10-12"},
            {"name": "Plank", "sets": 3, "reps": "60"},
        ],
    },
    {
        "name": "Strength 5x5",
        "description": "Classic strength program — heavy compound lifts",
        "category": "Strength",
        "difficulty": "advanced",
        "duration_minutes": 50,
        "exercises": [
            {"name": "Squat", "sets": 5, "reps": "5"},
            {"name": "Bench Press", "sets": 5, "reps": "5"},
            {"name": "Barbell Row", "sets": 5, "reps": "5"},
        ],
    },
    {
        "name": "HIIT Circuit",
        "description": "High intensity intervals — max burn in minimum time",
        "category": "Cardio",
        "difficulty": "advanced",
        "duration_minutes": 30,
        "exercises": [
            {"name": "Burpee", "sets": 4, "reps": "12"},
            {"name": "Jump Squat", "sets": 4, "reps": "15"},
            {"name": "Mountain Climber", "sets": 4, "reps": "20"},
            {"name": "Box Jump", "sets": 4, "reps": "10"},
            {"name": "Kettlebell Swing", "sets": 4, "reps": "15"},
        ],
    },
    {
        "name": "Core Crusher",
        "description": "Abs and core stability for a bulletproof midsection",
        "category": "Core",
        "difficulty": "beginner",
        "duration_minutes": 25,
        "exercises": [
            {"name": "Plank", "sets": 3, "reps": "60"},
            {"name": "Russian Twist", "sets": 3, "reps": "20"},
            {"name": "Leg Raise", "sets": 3, "reps": "12-15"},
            {"name": "Dead Bug", "sets": 3, "reps": "10"},
            {"name": "Bicycle Crunch", "sets": 3, "reps": "20"},
        ],
    },
    {
        "name": "Chest Focus",
        "description": "Complete chest development from all angles",
        "category": "Strength",
        "difficulty": "intermediate",
        "duration_minutes": 50,
        "exercises": [
            {"name": "Bench Press", "sets": 4, "reps": "8"},
            {"name": "Incline Bench Press", "sets": 3, "reps": "10"},
            {"name": "Dumbbell Flyes", "sets": 3, "reps": "12"},
            {"name": "Cable Crossover", "sets": 3, "reps": "15"},
            {"name": "Pec Deck Machine", "sets": 3, "reps": "15"},
        ],
    },
    {
        "name": "Back Builder",
        "description": "Wide and thick back development",
        "category": "Strength",
        "difficulty": "intermediate",
        "duration_minutes": 55,
        "exercises": [
            {"name": "Barbell Row", "sets": 4, "reps": "8"},
            {"name": "Pull-Up", "sets": 3, "reps": "8-10"},
            {"name": "Lat Pulldown", "sets": 3, "reps": "10-12"},
            {"name": "Seated Cable Row", "sets": 3, "reps": "12"},
            {"name": "Face Pull", "sets": 3, "reps": "15-20"},
        ],
    },
    {
        "name": "Shoulder Sculpt",
        "description": "Boulder shoulders from every angle",
        "category": "Strength",
        "difficulty": "intermediate",
        "duration_minutes": 45,
        "exercises": [
            {"name": "Overhead Press", "sets": 4, "reps": "8"},
            {"name": "Lateral Raise", "sets": 4, "reps": "15"},
            {"name": "Front Raise", "sets": 3, "reps": "12"},
            {"name": "Rear Delt Fly", "sets": 3, "reps": "15"},
            {"name": "Arnold Press", "sets": 3, "reps": "10"},
        ],
    },
    {
        "name": "Arm Day",
        "description": "Biceps and triceps for arm size and definition",
        "category": "Strength",
        "difficulty": "beginner",
        "duration_minutes": 40,
        "exercises": [
            {"name": "Barbell Curl", "sets": 3, "reps": "10"},
            {"name": "Hammer Curl", "sets": 3, "reps": "12"},
            {"name": "Preacher Curl", "sets": 3, "reps": "10"},
            {"name": "Tricep Pushdown", "sets": 3, "reps": "12"},
            {"name": "Skull Crusher", "sets": 3, "reps": "10"},
            {"name": "Overhead Tricep Extension", "sets": 3, "reps": "12"},
        ],
    },
    {
        "name": "Glute & Hamstring",
        "description": "Posterior chain focus for power and aesthetics",
        "category": "Strength",
        "difficulty": "intermediate",
        "duration_minutes": 50,
        "exercises": [
            {"name": "Romanian Deadlift", "sets": 4, "reps": "10"},
            {"name": "Hip Thrust", "sets": 4, "reps": "12"},
            {"name": "Lying Leg Curl", "sets": 3, "reps": "12"},
            {"name": "Glute Bridge", "sets": 3, "reps": "15"},
            {"name": "Walking Lunge", "sets": 3, "reps": "12"},
            {"name": "Standing Calf Raise", "sets": 4, "reps": "15"},
        ],
    },
    {
        "name": "Lower Body Power",
        "description": "Explosive leg strength and power",
        "category": "Strength",
        "difficulty": "advanced",
        "duration_minutes": 55,
        "exercises": [
            {"name": "Squat", "sets": 5, "reps": "5"},
            {"name": "Deadlift", "sets": 3, "reps": "5"},
            {"name": "Leg Press", "sets": 3, "reps": "10"},
            {"name": "Box Jump", "sets": 3, "reps": "8"},
            {"name": "Walking Lunge", "sets": 3, "reps": "12"},
        ],
    },
    {
        "name": "Powerlifting",
        "description": "The big three for maximum strength",
        "category": "Strength",
        "difficulty": "advanced",
        "duration_minutes": 60,
        "exercises": [
            {"name": "Squat", "sets": 5, "reps": "3"},
            {"name": "Bench Press", "sets": 5, "reps": "3"},
            {"name": "Deadlift", "sets": 5, "reps": "3"},
        ],
    },
    {
        "name": "Bodyweight Basics",
        "description": "No equipment needed — build strength anywhere",
        "category": "Bodyweight",
        "difficulty": "beginner",
        "duration_minutes": 30,
        "exercises": [
            {"name": "Push-Up", "sets": 3, "reps": "15"},
            {"name": "Pull-Up", "sets": 3, "reps": "8"},
            {"name": "Squat", "sets": 3, "reps": "20"},
            {"name": "Plank", "sets": 3, "reps": "60"},
            {"name": "Tricep Dip", "sets": 3, "reps": "12"},
            {"name": "Lunge", "sets": 3, "reps": "12"},
        ],
    },
    {
        "name": "Hypertrophy Upper",
        "description": "High volume upper body for muscle growth",
        "category": "Strength",
        "difficulty": "intermediate",
        "duration_minutes": 60,
        "exercises": [
            {"name": "Incline Bench Press", "sets": 4, "reps": "10"},
            {"name": "Dumbbell Bench Press", "sets": 3, "reps": "12"},
            {"name": "Cable Crossover", "sets": 3, "reps": "15"},
            {"name": "Barbell Row", "sets": 4, "reps": "10"},
            {"name": "Seated Cable Row", "sets": 3, "reps": "12"},
            {"name": "Barbell Curl", "sets": 3, "reps": "10"},
            {"name": "Tricep Pushdown", "sets": 3, "reps": "12"},
        ],
    },
    {
        "name": "Hypertrophy Lower",
        "description": "High volume lower body for leg size",
        "category": "Strength",
        "difficulty": "intermediate",
        "duration_minutes": 60,
        "exercises": [
            {"name": "Squat", "sets": 4, "reps": "10"},
            {"name": "Romanian Deadlift", "sets": 4, "reps": "10"},
            {"name": "Leg Press", "sets": 3, "reps": "12"},
            {"name": "Hip Thrust", "sets": 4, "reps": "12"},
            {"name": "Lying Leg Curl", "sets": 3, "reps": "12"},
            {"name": "Leg Extension", "sets": 3, "reps": "15"},
            {"name": "Standing Calf Raise", "sets": 4, "reps": "15"},
        ],
    },
    {
        "name": "Push Pull Superset",
        "description": "Paired push/pull exercises for efficiency and pump",
        "category": "Strength",
        "difficulty": "intermediate",
        "duration_minutes": 55,
        "exercises": [
            {"name": "Bench Press", "sets": 4, "reps": "8"},
            {"name": "Barbell Row", "sets": 4, "reps": "8"},
            {"name": "Overhead Press", "sets": 3, "reps": "10"},
            {"name": "Pull-Up", "sets": 3, "reps": "8"},
            {"name": "Lateral Raise", "sets": 3, "reps": "15"},
            {"name": "Barbell Curl", "sets": 3, "reps": "10"},
        ],
    },
    {
        "name": "Olympic Strength",
        "description": "Compound-heavy session inspired by Olympic lifting",
        "category": "Strength",
        "difficulty": "advanced",
        "duration_minutes": 60,
        "exercises": [
            {"name": "Deadlift", "sets": 4, "reps": "5"},
            {"name": "Front Squat", "sets": 3, "reps": "5"},
            {"name": "Overhead Press", "sets": 3, "reps": "5"},
            {"name": "Barbell Row", "sets": 3, "reps": "8"},
        ],
    },
    {
        "name": "Morning Activation",
        "description": "Quick activation to start the day right",
        "category": "Mobility",
        "difficulty": "beginner",
        "duration_minutes": 20,
        "exercises": [
            {"name": "Glute Bridge", "sets": 2, "reps": "15"},
            {"name": "Dead Bug", "sets": 2, "reps": "10"},
            {"name": "Plank", "sets": 2, "reps": "30"},
            {"name": "Side Plank", "sets": 2, "reps": "30"},
        ],
    },
    {
        "name": "Chest & Triceps",
        "description": "Targeted chest and tricep session for size and strength",
        "category": "Strength",
        "difficulty": "intermediate",
        "duration_minutes": 50,
        "exercises": [
            {"name": "Bench Press", "sets": 4, "reps": "8"},
            {"name": "Incline Dumbbell Press", "sets": 3, "reps": "10"},
            {"name": "Dumbbell Flyes", "sets": 3, "reps": "12"},
            {"name": "Tricep Pushdown", "sets": 3, "reps": "12"},
            {"name": "Skull Crusher", "sets": 3, "reps": "10"},
            {"name": "Diamond Push-Up", "sets": 3, "reps": "12"},
        ],
    },
    {
        "name": "Back & Biceps",
        "description": "Classic back and bicep session for pulling strength",
        "category": "Strength",
        "difficulty": "intermediate",
        "duration_minutes": 50,
        "exercises": [
            {"name": "Pull-Up", "sets": 4, "reps": "8"},
            {"name": "Barbell Row", "sets": 4, "reps": "8"},
            {"name": "Lat Pulldown", "sets": 3, "reps": "10"},
            {"name": "Hammer Curl", "sets": 3, "reps": "12"},
            {"name": "Concentration Curl", "sets": 3, "reps": "12"},
        ],
    },
]


def seed():
    app = create_app()
    with app.app_context():
        seeded = 0
        skipped = 0

        for tdata in SYSTEM_TEMPLATES:
            # Check if a system template with this name already exists
            existing = WorkoutTemplate.query.filter_by(
                name=tdata['name'], is_system=True
            ).first()
            if existing:
                print(f"  [SKIP] '{tdata['name']}' already exists")
                skipped += 1
                continue

            template = WorkoutTemplate(
                user_id=None,
                name=tdata['name'],
                description=tdata.get('description', ''),
                is_system=True,
                category=tdata.get('category'),
                difficulty=tdata.get('difficulty'),
                duration_minutes=tdata.get('duration_minutes'),
                created_at=datetime.utcnow(),
            )
            db.session.add(template)
            db.session.flush()

            exercises_added = 0
            for idx, ex_data in enumerate(tdata.get('exercises', [])):
                name_lower = ex_data['name'].strip().lower()
                exercise = Exercise.query.filter(
                    func.lower(Exercise.name) == name_lower
                ).first()

                if not exercise:
                    print(f"    [WARN] Exercise not found in DB: '{ex_data['name']}' — skipping")
                    continue

                te = TemplateExercise(
                    template_id=template.id,
                    exercise_id=exercise.id,
                    sets=ex_data.get('sets'),
                    reps=str(ex_data['reps']) if ex_data.get('reps') is not None else None,
                    order_index=idx + 1,
                )
                db.session.add(te)
                exercises_added += 1

            db.session.commit()
            print(f"  [OK]   '{tdata['name']}' — {exercises_added}/{len(tdata['exercises'])} exercises")
            seeded += 1

        print(f"\nDone. Seeded: {seeded}, Skipped (already exist): {skipped}")


if __name__ == '__main__':
    seed()
