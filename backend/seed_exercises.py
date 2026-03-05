"""
Seed script to populate the exercise library with 60+ common exercises.
Run: python seed_exercises.py
"""
from app import create_app
from database import db
from models import Exercise

EXERCISES = [
    # CHEST
    {"name": "Bench Press", "category": "Chest", "muscle_group": "Chest", "equipment": "Barbell"},
    {"name": "Incline Bench Press", "category": "Chest", "muscle_group": "Upper Chest", "equipment": "Barbell"},
    {"name": "Decline Bench Press", "category": "Chest", "muscle_group": "Lower Chest", "equipment": "Barbell"},
    {"name": "Dumbbell Bench Press", "category": "Chest", "muscle_group": "Chest", "equipment": "Dumbbells"},
    {"name": "Dumbbell Flyes", "category": "Chest", "muscle_group": "Chest", "equipment": "Dumbbells"},
    {"name": "Cable Crossover", "category": "Chest", "muscle_group": "Chest", "equipment": "Cable"},
    {"name": "Push-ups", "category": "Chest", "muscle_group": "Chest", "equipment": "Bodyweight"},
    {"name": "Chest Dips", "category": "Chest", "muscle_group": "Chest", "equipment": "Bodyweight"},

    # BACK
    {"name": "Deadlift", "category": "Back", "muscle_group": "Lower Back", "equipment": "Barbell"},
    {"name": "Barbell Row", "category": "Back", "muscle_group": "Upper Back", "equipment": "Barbell"},
    {"name": "Pull-ups", "category": "Back", "muscle_group": "Lats", "equipment": "Bodyweight"},
    {"name": "Chin-ups", "category": "Back", "muscle_group": "Lats", "equipment": "Bodyweight"},
    {"name": "Lat Pulldown", "category": "Back", "muscle_group": "Lats", "equipment": "Cable"},
    {"name": "Seated Cable Row", "category": "Back", "muscle_group": "Upper Back", "equipment": "Cable"},
    {"name": "Dumbbell Row", "category": "Back", "muscle_group": "Upper Back", "equipment": "Dumbbells"},
    {"name": "T-Bar Row", "category": "Back", "muscle_group": "Upper Back", "equipment": "Barbell"},
    {"name": "Face Pulls", "category": "Back", "muscle_group": "Rear Delts", "equipment": "Cable"},

    # SHOULDERS
    {"name": "Overhead Press", "category": "Shoulders", "muscle_group": "Shoulders", "equipment": "Barbell"},
    {"name": "Dumbbell Shoulder Press", "category": "Shoulders", "muscle_group": "Shoulders", "equipment": "Dumbbells"},
    {"name": "Lateral Raises", "category": "Shoulders", "muscle_group": "Side Delts", "equipment": "Dumbbells"},
    {"name": "Front Raises", "category": "Shoulders", "muscle_group": "Front Delts", "equipment": "Dumbbells"},
    {"name": "Reverse Flyes", "category": "Shoulders", "muscle_group": "Rear Delts", "equipment": "Dumbbells"},
    {"name": "Arnold Press", "category": "Shoulders", "muscle_group": "Shoulders", "equipment": "Dumbbells"},
    {"name": "Upright Row", "category": "Shoulders", "muscle_group": "Shoulders", "equipment": "Barbell"},

    # LEGS
    {"name": "Squat", "category": "Legs", "muscle_group": "Quads", "equipment": "Barbell"},
    {"name": "Front Squat", "category": "Legs", "muscle_group": "Quads", "equipment": "Barbell"},
    {"name": "Leg Press", "category": "Legs", "muscle_group": "Quads", "equipment": "Machine"},
    {"name": "Romanian Deadlift", "category": "Legs", "muscle_group": "Hamstrings", "equipment": "Barbell"},
    {"name": "Leg Curl", "category": "Legs", "muscle_group": "Hamstrings", "equipment": "Machine"},
    {"name": "Leg Extension", "category": "Legs", "muscle_group": "Quads", "equipment": "Machine"},
    {"name": "Bulgarian Split Squat", "category": "Legs", "muscle_group": "Quads", "equipment": "Dumbbells"},
    {"name": "Lunges", "category": "Legs", "muscle_group": "Quads", "equipment": "Dumbbells"},
    {"name": "Hip Thrust", "category": "Legs", "muscle_group": "Glutes", "equipment": "Barbell"},
    {"name": "Calf Raises", "category": "Legs", "muscle_group": "Calves", "equipment": "Machine"},
    {"name": "Goblet Squat", "category": "Legs", "muscle_group": "Quads", "equipment": "Dumbbells"},
    {"name": "Sumo Deadlift", "category": "Legs", "muscle_group": "Hamstrings", "equipment": "Barbell"},

    # ARMS - BICEPS
    {"name": "Barbell Curl", "category": "Arms", "muscle_group": "Biceps", "equipment": "Barbell"},
    {"name": "Dumbbell Curl", "category": "Arms", "muscle_group": "Biceps", "equipment": "Dumbbells"},
    {"name": "Hammer Curl", "category": "Arms", "muscle_group": "Biceps", "equipment": "Dumbbells"},
    {"name": "Preacher Curl", "category": "Arms", "muscle_group": "Biceps", "equipment": "Barbell"},
    {"name": "Concentration Curl", "category": "Arms", "muscle_group": "Biceps", "equipment": "Dumbbells"},
    {"name": "Cable Curl", "category": "Arms", "muscle_group": "Biceps", "equipment": "Cable"},

    # ARMS - TRICEPS
    {"name": "Tricep Pushdown", "category": "Arms", "muscle_group": "Triceps", "equipment": "Cable"},
    {"name": "Overhead Tricep Extension", "category": "Arms", "muscle_group": "Triceps", "equipment": "Dumbbells"},
    {"name": "Skull Crushers", "category": "Arms", "muscle_group": "Triceps", "equipment": "Barbell"},
    {"name": "Close Grip Bench Press", "category": "Arms", "muscle_group": "Triceps", "equipment": "Barbell"},
    {"name": "Diamond Push-ups", "category": "Arms", "muscle_group": "Triceps", "equipment": "Bodyweight"},
    {"name": "Dips", "category": "Arms", "muscle_group": "Triceps", "equipment": "Bodyweight"},

    # CORE
    {"name": "Plank", "category": "Core", "muscle_group": "Abs", "equipment": "Bodyweight"},
    {"name": "Crunches", "category": "Core", "muscle_group": "Abs", "equipment": "Bodyweight"},
    {"name": "Hanging Leg Raises", "category": "Core", "muscle_group": "Abs", "equipment": "Bodyweight"},
    {"name": "Russian Twist", "category": "Core", "muscle_group": "Obliques", "equipment": "Bodyweight"},
    {"name": "Ab Wheel Rollout", "category": "Core", "muscle_group": "Abs", "equipment": "Ab Wheel"},
    {"name": "Cable Woodchop", "category": "Core", "muscle_group": "Obliques", "equipment": "Cable"},
    {"name": "Mountain Climbers", "category": "Core", "muscle_group": "Abs", "equipment": "Bodyweight"},

    # CARDIO
    {"name": "Running", "category": "Cardio", "muscle_group": "Full Body", "equipment": "None"},
    {"name": "Cycling", "category": "Cardio", "muscle_group": "Legs", "equipment": "Bike"},
    {"name": "Rowing", "category": "Cardio", "muscle_group": "Full Body", "equipment": "Rowing Machine"},
    {"name": "Jump Rope", "category": "Cardio", "muscle_group": "Full Body", "equipment": "Jump Rope"},
    {"name": "Burpees", "category": "Cardio", "muscle_group": "Full Body", "equipment": "Bodyweight"},
    {"name": "Box Jumps", "category": "Cardio", "muscle_group": "Legs", "equipment": "Box"},
    {"name": "Kettlebell Swings", "category": "Cardio", "muscle_group": "Full Body", "equipment": "Kettlebell"},

    # FLEXIBILITY
    {"name": "Yoga Flow", "category": "Flexibility", "muscle_group": "Full Body", "equipment": "None"},
    {"name": "Foam Rolling", "category": "Flexibility", "muscle_group": "Full Body", "equipment": "Foam Roller"},
    {"name": "Stretching", "category": "Flexibility", "muscle_group": "Full Body", "equipment": "None"},
]


def seed():
    app = create_app()
    with app.app_context():
        added = 0
        skipped = 0
        for ex_data in EXERCISES:
            exists = Exercise.query.filter(
                db.func.lower(Exercise.name) == ex_data["name"].lower(),
                Exercise.is_global == True
            ).first()
            if exists:
                skipped += 1
                continue
            exercise = Exercise(
                user_id=1,
                name=ex_data["name"],
                category=ex_data["category"],
                muscle_group=ex_data["muscle_group"],
                equipment=ex_data.get("equipment"),
                is_global=True,
                created_by=1
            )
            db.session.add(exercise)
            added += 1
        db.session.commit()
        print(f"Seeded {added} exercises ({skipped} already existed)")


if __name__ == "__main__":
    seed()
