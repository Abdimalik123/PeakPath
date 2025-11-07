-- ---------- USERS ----------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    firstname TEXT,
    lastname TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ---------- USER_PROFILES (match DB) ----------
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER,
    gender VARCHAR,
    height_cm NUMERIC,
    current_weight_kg NUMERIC,
    goal_weight_kg NUMERIC,
    activity_level VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- ---------- WEIGHT_LOGS (match DB) ----------
CREATE TABLE IF NOT EXISTS weight_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight_kg NUMERIC,
    date DATE,
    created_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, date);

-- ---------- WORKOUTS ----------
CREATE TABLE IF NOT EXISTS workouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR,
    duration INTEGER,
    date DATE,
    notes TEXT,
    created_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date);

-- ---------- EXERCISES (match DB) ----------
CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR,
    category VARCHAR,
    muscle_group VARCHAR,
    equipment VARCHAR,
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_exercises_user_name ON exercises(user_id, name);

-- ---------- WORKOUT_EXERCISES ----------
CREATE TABLE IF NOT EXISTS workout_exercises (
    id SERIAL PRIMARY KEY,
    workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    sets INTEGER,
    reps INTEGER,
    weight NUMERIC,
    duration INTEGER,
    rest_time INTEGER,
    notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id);

-- ---------- WORKOUT_TEMPLATES ----------
CREATE TABLE IF NOT EXISTS workout_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR,
    description TEXT,
    created_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_workout_templates_user_id ON workout_templates(user_id);

-- ---------- TEMPLATE_EXERCISES (match DB) ----------
CREATE TABLE IF NOT EXISTS template_exercises (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    sets INTEGER,
    reps INTEGER,
    weight NUMERIC,
    duration INTEGER,
    rest_time INTEGER,
    order_index INTEGER,
    notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_template_exercises_template_id ON template_exercises(template_id);

-- ---------- HABITS (match DB) ----------
CREATE TABLE IF NOT EXISTS habits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR,
    frequency VARCHAR,
    reminder_time TIME,
    description TEXT,
    next_occurrence DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);

-- ---------- HABIT_LOGS (match DB: no created_at) ----------
CREATE TABLE IF NOT EXISTS habit_logs (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date DATE,
    completed BOOLEAN
);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);

-- ---------- GOALS (match DB) ----------
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR,
    type VARCHAR,
    target INTEGER,
    progress INTEGER,
    deadline DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- ---------- NUTRITION_LOGS (match DB) ----------
CREATE TABLE IF NOT EXISTS nutrition_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meal_type VARCHAR,
    description TEXT,
    calories INTEGER,
    protein NUMERIC,
    carbs NUMERIC,
    fats NUMERIC,
    date DATE,
    created_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON nutrition_logs(user_id, date);

-- ---------- NOTIFICATIONS (match DB) ----------
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR,
    message TEXT,
    is_read BOOLEAN,
    priority VARCHAR,
    scheduled_for TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ---------- ACTIVITY_LOGS (match DB) ----------
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR,
    entity_type VARCHAR,
    entity_id INTEGER,
    created_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
