-- =============================================================================
-- fix_exercises.sql
-- Remaps duplicate exercise references to canonical IDs, deletes duplicates,
-- and promotes the 3 remaining user-created exercises to global.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Remap workout_exercises references
-- -----------------------------------------------------------------------------

-- ID 53 "Barbell Bench Press" -> ID 3 "Bench Press"
UPDATE workout_exercises SET exercise_id = 3   WHERE exercise_id = 53;
-- ID 55 "Chest Fly (Cable or DB)" -> ID 6 "Dumbbell Flyes"
UPDATE workout_exercises SET exercise_id = 6   WHERE exercise_id = 55;
-- ID 56 "Shoulder Press" -> ID 16 "Overhead Press"
UPDATE workout_exercises SET exercise_id = 16  WHERE exercise_id = 56;
-- ID 57 "Lateral Raises" -> ID 18 "Lateral Raise"
UPDATE workout_exercises SET exercise_id = 18  WHERE exercise_id = 57;
-- ID 58 "Tricep Dips" -> ID 26 "Tricep Dip"
UPDATE workout_exercises SET exercise_id = 26  WHERE exercise_id = 58;
-- ID 59 "Tricep Pushdowns" -> ID 28 "Tricep Pushdown"
UPDATE workout_exercises SET exercise_id = 28  WHERE exercise_id = 59;
-- ID 60 "Push-ups" -> ID 7 "Push-Up"
UPDATE workout_exercises SET exercise_id = 7   WHERE exercise_id = 60;
-- ID 61 "Bodyweight Squats" -> ID 31 "Squat"
UPDATE workout_exercises SET exercise_id = 31  WHERE exercise_id = 61;
-- ID 63 "Glute Bridges" -> ID 40 "Glute Bridge"
UPDATE workout_exercises SET exercise_id = 40  WHERE exercise_id = 63;
-- ID 64 "Bicycle Crunches" -> ID 109 "Bicycle Crunch"
UPDATE workout_exercises SET exercise_id = 109 WHERE exercise_id = 64;
-- ID 65 "Barbell Squat" -> ID 31 "Squat"
UPDATE workout_exercises SET exercise_id = 31  WHERE exercise_id = 65;
-- ID 67 "Leg Curls" -> ID 37 "Lying Leg Curl"
UPDATE workout_exercises SET exercise_id = 37  WHERE exercise_id = 67;
-- ID 68 "Calf Raises" -> ID 42 "Standing Calf Raise"
UPDATE workout_exercises SET exercise_id = 42  WHERE exercise_id = 68;
-- ID 122 "Barbell Rows" -> ID 10 "Barbell Row"
UPDATE workout_exercises SET exercise_id = 10  WHERE exercise_id = 122;

-- -----------------------------------------------------------------------------
-- STEP 2: Remap personal_records references
-- -----------------------------------------------------------------------------

UPDATE personal_records SET exercise_id = 3   WHERE exercise_id = 53;
UPDATE personal_records SET exercise_id = 6   WHERE exercise_id = 55;
UPDATE personal_records SET exercise_id = 16  WHERE exercise_id = 56;
UPDATE personal_records SET exercise_id = 18  WHERE exercise_id = 57;
UPDATE personal_records SET exercise_id = 26  WHERE exercise_id = 58;
UPDATE personal_records SET exercise_id = 28  WHERE exercise_id = 59;
UPDATE personal_records SET exercise_id = 7   WHERE exercise_id = 60;
UPDATE personal_records SET exercise_id = 31  WHERE exercise_id = 61;
UPDATE personal_records SET exercise_id = 40  WHERE exercise_id = 63;
UPDATE personal_records SET exercise_id = 109 WHERE exercise_id = 64;
UPDATE personal_records SET exercise_id = 31  WHERE exercise_id = 65;
UPDATE personal_records SET exercise_id = 37  WHERE exercise_id = 67;
UPDATE personal_records SET exercise_id = 42  WHERE exercise_id = 68;
UPDATE personal_records SET exercise_id = 10  WHERE exercise_id = 122;

-- -----------------------------------------------------------------------------
-- STEP 3: Remap template_exercises references
-- -----------------------------------------------------------------------------

UPDATE template_exercises SET exercise_id = 3   WHERE exercise_id = 53;
UPDATE template_exercises SET exercise_id = 6   WHERE exercise_id = 55;
UPDATE template_exercises SET exercise_id = 16  WHERE exercise_id = 56;
UPDATE template_exercises SET exercise_id = 18  WHERE exercise_id = 57;
UPDATE template_exercises SET exercise_id = 26  WHERE exercise_id = 58;
UPDATE template_exercises SET exercise_id = 28  WHERE exercise_id = 59;
UPDATE template_exercises SET exercise_id = 7   WHERE exercise_id = 60;
UPDATE template_exercises SET exercise_id = 31  WHERE exercise_id = 61;
UPDATE template_exercises SET exercise_id = 40  WHERE exercise_id = 63;
UPDATE template_exercises SET exercise_id = 109 WHERE exercise_id = 64;
UPDATE template_exercises SET exercise_id = 31  WHERE exercise_id = 65;
UPDATE template_exercises SET exercise_id = 37  WHERE exercise_id = 67;
UPDATE template_exercises SET exercise_id = 42  WHERE exercise_id = 68;
UPDATE template_exercises SET exercise_id = 10  WHERE exercise_id = 122;

-- -----------------------------------------------------------------------------
-- STEP 4: Remap challenges references (no ondelete set — would block DELETE)
-- -----------------------------------------------------------------------------

UPDATE challenges SET target_exercise_id = 3   WHERE target_exercise_id = 53;
UPDATE challenges SET target_exercise_id = 6   WHERE target_exercise_id = 55;
UPDATE challenges SET target_exercise_id = 16  WHERE target_exercise_id = 56;
UPDATE challenges SET target_exercise_id = 18  WHERE target_exercise_id = 57;
UPDATE challenges SET target_exercise_id = 26  WHERE target_exercise_id = 58;
UPDATE challenges SET target_exercise_id = 28  WHERE target_exercise_id = 59;
UPDATE challenges SET target_exercise_id = 7   WHERE target_exercise_id = 60;
UPDATE challenges SET target_exercise_id = 31  WHERE target_exercise_id = 61;
UPDATE challenges SET target_exercise_id = 40  WHERE target_exercise_id = 63;
UPDATE challenges SET target_exercise_id = 109 WHERE target_exercise_id = 64;
UPDATE challenges SET target_exercise_id = 31  WHERE target_exercise_id = 65;
UPDATE challenges SET target_exercise_id = 37  WHERE target_exercise_id = 67;
UPDATE challenges SET target_exercise_id = 42  WHERE target_exercise_id = 68;
UPDATE challenges SET target_exercise_id = 10  WHERE target_exercise_id = 122;

-- -----------------------------------------------------------------------------
-- STEP 5: Remap goal_links references (no FK — won't block, but cleans orphans)
-- -----------------------------------------------------------------------------

UPDATE goal_links SET entity_id = 3   WHERE entity_type = 'exercise' AND entity_id = 53;
UPDATE goal_links SET entity_id = 6   WHERE entity_type = 'exercise' AND entity_id = 55;
UPDATE goal_links SET entity_id = 16  WHERE entity_type = 'exercise' AND entity_id = 56;
UPDATE goal_links SET entity_id = 18  WHERE entity_type = 'exercise' AND entity_id = 57;
UPDATE goal_links SET entity_id = 26  WHERE entity_type = 'exercise' AND entity_id = 58;
UPDATE goal_links SET entity_id = 28  WHERE entity_type = 'exercise' AND entity_id = 59;
UPDATE goal_links SET entity_id = 7   WHERE entity_type = 'exercise' AND entity_id = 60;
UPDATE goal_links SET entity_id = 31  WHERE entity_type = 'exercise' AND entity_id = 61;
UPDATE goal_links SET entity_id = 40  WHERE entity_type = 'exercise' AND entity_id = 63;
UPDATE goal_links SET entity_id = 109 WHERE entity_type = 'exercise' AND entity_id = 64;
UPDATE goal_links SET entity_id = 31  WHERE entity_type = 'exercise' AND entity_id = 65;
UPDATE goal_links SET entity_id = 37  WHERE entity_type = 'exercise' AND entity_id = 67;
UPDATE goal_links SET entity_id = 42  WHERE entity_type = 'exercise' AND entity_id = 68;
UPDATE goal_links SET entity_id = 10  WHERE entity_type = 'exercise' AND entity_id = 122;

-- -----------------------------------------------------------------------------
-- STEP 6: Delete duplicate exercise rows
-- -----------------------------------------------------------------------------

DELETE FROM exercises
WHERE id IN (53, 55, 56, 57, 58, 59, 60, 61, 63, 64, 65, 67, 68, 122);

-- -----------------------------------------------------------------------------
-- STEP 7: Promote remaining user-created exercises to global
-- -----------------------------------------------------------------------------

-- ID 54 "Incline Dumbbell Press"
UPDATE exercises
SET
    user_id     = 1,
    created_by  = 1,
    is_global   = TRUE,
    category    = 'Strength',
    muscle_group = 'Chest',
    equipment   = 'Dumbbell',
    description = 'Lie on an incline bench and press dumbbells up from chest level.',
    updated_at  = NOW()
WHERE id = 54;

-- ID 62 "Lunges"
UPDATE exercises
SET
    user_id     = 1,
    created_by  = 1,
    is_global   = TRUE,
    category    = 'Strength',
    muscle_group = 'Quads, Glutes',
    equipment   = 'Bodyweight',
    description = 'Step forward alternating legs, lowering rear knee toward the floor.',
    updated_at  = NOW()
WHERE id = 62;

-- ID 66 "Walking Lunges"
UPDATE exercises
SET
    user_id     = 1,
    created_by  = 1,
    is_global   = TRUE,
    category    = 'Strength',
    muscle_group = 'Quads, Glutes',
    equipment   = 'Bodyweight',
    description = 'Walk forward taking large steps lowering rear knee toward the floor.',
    updated_at  = NOW()
WHERE id = 66;
