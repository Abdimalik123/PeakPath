from flask import Blueprint, jsonify, request, current_app
from database import db
from models import Exercise
from api.auth import login_required

exercise_library_bp = Blueprint('exercise_library_bp', __name__)

# ---------------------------------------------------------------------------
# Exercise library
# Each entry uses four phase keys: setup, lifting, lowering, completion.
# For isometric holds (Plank, Side Plank, Wall Sit, L-Sit) lowering is [].
# Keys must match the lowercase DB exercise name exactly.
# ---------------------------------------------------------------------------
EXERCISE_LIBRARY = {

    # =========================================================================
    # CHEST
    # =========================================================================
    'bench press': {
        'muscle_groups': ['Chest', 'Triceps', 'Shoulders'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Lie flat on the bench with feet planted firmly on the floor.',
            'Grip the bar just outside shoulder width with a full grip and retract your shoulder blades.',
        ],
        'lifting': [
            'Press the bar explosively off the chest, driving it straight up.',
            'Lock out the elbows fully at the top without losing shoulder blade retraction.',
        ],
        'lowering': [
            'Lower the bar in a controlled arc to mid-chest, taking 2-3 seconds.',
            'Keep elbows at roughly 45 degrees from the torso throughout the descent.',
        ],
        'completion': [
            'Re-rack the bar under full control; avoid twisting or releasing one hand early.',
        ],
    },
    'incline bench press': {
        'muscle_groups': ['Upper Chest', 'Triceps', 'Shoulders'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Set the bench to 30-45 degrees and lie back with feet flat on the floor.',
            'Grip the bar slightly wider than shoulder width and unrack with straight arms.',
        ],
        'lifting': [
            'Press the bar up and very slightly back toward the rack in a straight line.',
            'Fully extend the elbows without letting the shoulders roll forward.',
        ],
        'lowering': [
            'Lower with control to the upper chest, keeping the bar path consistent.',
            'Maintain tight shoulder blade retraction and avoid flaring the elbows past 60 degrees.',
        ],
        'completion': [
            'Re-rack safely; have a spotter present for heavier sets.',
        ],
    },
    'decline bench press': {
        'muscle_groups': ['Lower Chest', 'Triceps', 'Shoulders'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Lock feet into the decline bench pad and lie back; the head should be lower than the hips.',
            'Grip the bar just outside shoulder width and unrack with arms extended.',
        ],
        'lifting': [
            'Press the bar straight up, keeping the wrists stacked over the elbows.',
            'Achieve full elbow lockout at the top.',
        ],
        'lowering': [
            'Lower to the lower portion of the chest in a slow, controlled movement.',
            'Keep glutes and upper back in contact with the bench throughout.',
        ],
        'completion': [
            'Re-rack carefully and unclip feet before sitting up to avoid dizziness.',
        ],
    },
    'dumbbell flyes': {
        'muscle_groups': ['Chest', 'Shoulders'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Lie flat on a bench holding dumbbells above the chest, palms facing each other.',
            'Maintain a slight, fixed bend in the elbows throughout the entire movement.',
        ],
        'lifting': [
            'Squeeze the chest to bring the dumbbells back together in a wide arc.',
            'Do not allow the elbows to bend further as you close; keep the arc shape.',
        ],
        'lowering': [
            'Open the arms out and down in a wide arc until you feel a deep chest stretch.',
            'Stop when elbows are level with the bench to protect the shoulder joint.',
        ],
        'completion': [
            'Bring the dumbbells together with control and pause briefly before the next rep.',
        ],
    },
    'push-up': {
        'muscle_groups': ['Chest', 'Triceps', 'Shoulders', 'Core'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'beginner',
        'setup': [
            'Place hands just outside shoulder width, fingers pointing forward.',
            'Create a rigid plank line from head to heels; engage core and glutes.',
        ],
        'lifting': [
            'Push through the palms to extend the elbows fully, protracting the shoulder blades at the top.',
            'Maintain the plank position; do not let hips rise or sag.',
        ],
        'lowering': [
            'Bend the elbows at roughly 45 degrees and lower the chest to just above the floor.',
            'Keep the neck neutral and descend with full control.',
        ],
        'completion': [
            'Reset the plank tension at the top before initiating the next repetition.',
        ],
    },
    'cable crossover': {
        'muscle_groups': ['Chest', 'Shoulders'],
        'equipment': 'Cable Machine',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Set both pulleys to the highest position; stand in the center with a split stance.',
            'Grab each handle with a slight elbow bend and lean forward slightly at the hips.',
        ],
        'lifting': [
            'Bring the handles down and together in a wide arc, squeezing the chest hard at the bottom.',
            'Allow the hands to cross slightly at full contraction for maximum squeeze.',
        ],
        'lowering': [
            'Open the arms back up in the same arc, feeling the chest stretch fully.',
            'Resist the cables on the way back; do not let them snap back uncontrolled.',
        ],
        'completion': [
            'Hold the contracted position for one count on each rep before releasing.',
        ],
    },
    'dumbbell bench press': {
        'muscle_groups': ['Chest', 'Triceps', 'Shoulders'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Sit on the bench edge with dumbbells on thighs, then kick them up as you lie back.',
            'Hold dumbbells at chest level with palms facing forward, elbows at 45 degrees.',
        ],
        'lifting': [
            'Press both dumbbells up simultaneously until arms are fully extended.',
            'Move the dumbbells slightly inward at the top for a better chest contraction.',
        ],
        'lowering': [
            'Lower slowly to chest level, feeling the stretch across the pectorals.',
            'Keep elbows at roughly 45 degrees; do not let them flare to 90 degrees.',
        ],
        'completion': [
            'To dismount, bring dumbbells to thighs then sit up; do not drop them sideways.',
        ],
    },
    'pec deck machine': {
        'muscle_groups': ['Chest', 'Shoulders'],
        'equipment': 'Machine',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Adjust the seat so elbows are at shoulder height when arms are on the pads.',
            'Sit tall with back pressed against the pad and core engaged.',
        ],
        'lifting': [
            'Squeeze the pads together by contracting the chest, not by hunching the shoulders.',
            'Pause briefly at full contraction before releasing.',
        ],
        'lowering': [
            'Allow the pads to open back until you feel a comfortable chest stretch.',
            'Do not let the weight stack slam; control the entire return.',
        ],
        'completion': [
            'Keep shoulder blades retracted on every rep to protect the shoulder joint.',
        ],
    },
    'landmine press': {
        'muscle_groups': ['Upper Chest', 'Shoulders', 'Triceps'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Anchor one end of a barbell in a landmine attachment or a corner.',
            'Kneel or stand facing the bar, holding the sleeve with both hands at chest height.',
        ],
        'lifting': [
            'Press the bar up and forward in its natural arc, fully extending the arms.',
            'Maintain a tall torso; avoid excessive lean or shrug.',
        ],
        'lowering': [
            'Lower the bar back to chest height along the same arc, under control.',
            'Keep elbows tucked and core braced throughout the descent.',
        ],
        'completion': [
            'Return to a neutral posture between reps to reset tension.',
        ],
    },
    'incline dumbbell press': {
        'muscle_groups': ['Upper Chest', 'Triceps', 'Shoulders'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Set the bench to 30-45 degrees and kick the dumbbells up as you lie back.',
            'Hold dumbbells at upper-chest level with palms facing forward.',
        ],
        'lifting': [
            'Press the dumbbells upward until arms are fully extended, bringing them slightly together.',
            'Focus on contracting the upper chest and avoid shrugging the shoulders.',
        ],
        'lowering': [
            'Lower the dumbbells slowly to the sides of the upper chest.',
            'Keep elbows at roughly 45 degrees; do not let them flare excessively.',
        ],
        'completion': [
            'Sit the dumbbells on the thighs before standing to avoid shoulder strain.',
        ],
    },

    # =========================================================================
    # BACK
    # =========================================================================
    'pull-up': {
        'muscle_groups': ['Lats', 'Biceps', 'Rear Delts'],
        'equipment': 'Pull-Up Bar',
        'category': 'Bodyweight',
        'difficulty': 'intermediate',
        'setup': [
            'Hang from the bar with an overhand grip slightly wider than shoulders.',
            'Depress and retract the shoulder blades before pulling.',
        ],
        'lifting': [
            'Pull elbows down and back until the chin clears the bar.',
            'Lead with the chest toward the bar, not the chin alone.',
        ],
        'lowering': [
            'Lower back to a full dead hang in a slow, controlled 2-3 second descent.',
            'Resist the urge to drop quickly; the eccentric builds strength.',
        ],
        'completion': [
            'Pause briefly in the dead hang to eliminate momentum before the next rep.',
        ],
    },
    'barbell row': {
        'muscle_groups': ['Lats', 'Rhomboids', 'Biceps', 'Rear Delts'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Hinge at the hips to about 45 degrees with a flat back; grip bar just outside hip width.',
            'Keep the bar close to the shins; engage the lats before the first pull.',
        ],
        'lifting': [
            'Drive the elbows back and up, rowing the bar into the lower chest or upper abdomen.',
            'Squeeze the shoulder blades together at the top.',
        ],
        'lowering': [
            'Lower the bar with control, fully extending the arms to stretch the lats.',
            'Maintain the hip hinge; do not stand up or use momentum.',
        ],
        'completion': [
            'Reset the flat back and brace the core before each repetition.',
        ],
    },
    'dumbbell row': {
        'muscle_groups': ['Lats', 'Rhomboids', 'Biceps'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Place one knee and hand on a flat bench; hold a dumbbell in the opposite hand.',
            'Keep the back flat and the working shoulder level with the hips.',
        ],
        'lifting': [
            'Pull the dumbbell straight up toward the hip, keeping the elbow close to the body.',
            'Rotate the torso slightly at the top to achieve a full contraction.',
        ],
        'lowering': [
            'Lower the dumbbell in a straight line back down until the arm is fully extended.',
            'Feel the lat stretch at the bottom before initiating the next rep.',
        ],
        'completion': [
            'Complete all reps on one side before switching; keep hips square throughout.',
        ],
    },
    'lat pulldown': {
        'muscle_groups': ['Lats', 'Biceps', 'Rear Delts'],
        'equipment': 'Cable Machine',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Sit with thighs secured under the pad; grip the bar wider than shoulder width.',
            'Lean back very slightly and depress the shoulder blades before pulling.',
        ],
        'lifting': [
            'Pull the bar to the upper chest by driving the elbows down and back.',
            'Squeeze the lats hard at the bottom of the movement.',
        ],
        'lowering': [
            'Allow the bar to rise with control until the arms are fully extended.',
            'Feel the full lat stretch at the top without shrugging the shoulders.',
        ],
        'completion': [
            'Avoid swinging the torso; keep movement controlled and isolated to the lats.',
        ],
    },
    'seated cable row': {
        'muscle_groups': ['Lats', 'Rhomboids', 'Biceps', 'Rear Delts'],
        'equipment': 'Cable Machine',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Sit upright on the bench with knees slightly bent and feet on the platform.',
            'Grip the handle with arms extended and a slight tension in the cable.',
        ],
        'lifting': [
            'Row the handle to the lower abdomen, driving the elbows straight back.',
            'Sit tall and squeeze the shoulder blades together at full contraction.',
        ],
        'lowering': [
            'Extend the arms back out fully, allowing the shoulder blades to protract for a lat stretch.',
            'Do not round the lower back on the way out; hinge slightly at the hips only.',
        ],
        'completion': [
            'Maintain an upright torso throughout; avoid rocking back and forth for momentum.',
        ],
    },
    'deadlift': {
        'muscle_groups': ['Hamstrings', 'Glutes', 'Lower Back', 'Traps'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'advanced',
        'setup': [
            'Stand with feet hip-width, bar over mid-foot; hinge to grip just outside the legs.',
            'Set the hips, flatten the back, take a big breath and brace the core hard.',
        ],
        'lifting': [
            'Push the floor away while keeping the bar dragging against the legs.',
            'Lock out hips and knees simultaneously at the top; do not hyperextend the lower back.',
        ],
        'lowering': [
            'Hinge at the hips first, then bend the knees once the bar passes them.',
            'Lower with control to the floor, maintaining bar contact with the legs.',
        ],
        'completion': [
            'Reset completely between reps for maximum tension and safety.',
        ],
    },
    'face pull': {
        'muscle_groups': ['Rear Delts', 'External Rotators', 'Traps'],
        'equipment': 'Cable Machine',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Set the cable to upper-chest or face height with a rope attachment.',
            'Grip the rope with palms facing in, thumbs toward you, and step back.',
        ],
        'lifting': [
            'Pull the rope toward the face, separating the hands and driving the elbows wide.',
            'Externally rotate so the hands finish behind the level of the elbows.',
        ],
        'lowering': [
            'Extend the arms forward with control, keeping tension in the cable.',
            'Resist the temptation to let the cable jerk back.',
        ],
        'completion': [
            'Focus on the rear delt contraction and external rotation, not just pulling heavy.',
        ],
    },
    't-bar row': {
        'muscle_groups': ['Lats', 'Rhomboids', 'Biceps', 'Rear Delts'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Straddle the bar in a T-bar row station and hinge to roughly 45 degrees.',
            'Grip the handles with a neutral or overhand grip; keep the back flat.',
        ],
        'lifting': [
            'Row the bar up toward the chest, driving the elbows back and squeezing the shoulder blades.',
            'Keep the chest up and avoid rounding the upper back.',
        ],
        'lowering': [
            'Lower the bar until the arms are fully extended, feeling the lat stretch.',
            'Resist letting the weight pull you forward; maintain the hip hinge position.',
        ],
        'completion': [
            'Reset the flat-back position before each rep; do not bounce at the bottom.',
        ],
    },
    'chest-supported row': {
        'muscle_groups': ['Lats', 'Rhomboids', 'Rear Delts', 'Biceps'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Set an incline bench to 30-45 degrees and lie chest-down with dumbbells hanging.',
            'Keep the chest in contact with the pad throughout; do not use torso momentum.',
        ],
        'lifting': [
            'Row both dumbbells up by driving the elbows back and squeezing the shoulder blades.',
            'Hold briefly at the top of the movement.',
        ],
        'lowering': [
            'Lower the dumbbells with control until the arms are fully extended.',
            'Feel the full stretch in the lats before the next pull.',
        ],
        'completion': [
            'The chest-support eliminates cheating; use it as a form check tool.',
        ],
    },
    'inverted row': {
        'muscle_groups': ['Lats', 'Rhomboids', 'Biceps', 'Core'],
        'equipment': 'Barbell',
        'category': 'Bodyweight',
        'difficulty': 'beginner',
        'setup': [
            'Set a bar at waist height in a rack; hang underneath with arms extended and heels on the floor.',
            'Create a rigid plank from head to heels before pulling.',
        ],
        'lifting': [
            'Pull the chest up to the bar by driving the elbows back and squeezing the shoulder blades.',
            'Keep the body rigid; do not let the hips sag.',
        ],
        'lowering': [
            'Lower back to full arm extension with control, maintaining the plank.',
            'Do not allow the hips to drop or pike during the descent.',
        ],
        'completion': [
            'Adjust difficulty by raising or lowering the bar; lower bar equals harder.',
        ],
    },
    'straight-arm pulldown': {
        'muscle_groups': ['Lats', 'Serratus Anterior'],
        'equipment': 'Cable Machine',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Set the cable to the top position with a straight bar or rope; stand back slightly.',
            'Hinge forward slightly at the hips, arms straight with a slight elbow bend.',
        ],
        'lifting': [
            'Pull the bar down in a wide arc to the thighs by contracting the lats.',
            'Keep the elbows locked in the same slight bend throughout.',
        ],
        'lowering': [
            'Slowly raise the bar back to the start, feeling the full lat stretch overhead.',
            'Resist the cable on the way up; do not let it pull the arms passively.',
        ],
        'completion': [
            'Keep the torso angle fixed; movement should come entirely from the shoulder joint.',
        ],
    },
    'single-arm cable row': {
        'muscle_groups': ['Lats', 'Rhomboids', 'Biceps'],
        'equipment': 'Cable Machine',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Set a single cable handle to mid-height; stand or sit sideways to the cable stack.',
            'Grip with one hand, plant the feet, and brace the core.',
        ],
        'lifting': [
            'Row the handle toward the hip, rotating slightly to achieve full contraction.',
            'Drive the elbow straight back and squeeze the shoulder blade at the top.',
        ],
        'lowering': [
            'Extend the arm fully forward, allowing the shoulder blade to protract for a lat stretch.',
            'Control the cable; do not let it snap the arm forward.',
        ],
        'completion': [
            'Complete all reps on one side before switching to maintain focus and fatigue balance.',
        ],
    },
    'rack pull': {
        'muscle_groups': ['Lower Back', 'Traps', 'Glutes', 'Hamstrings'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Set safety bars or pins at knee height; load the bar and stand with feet hip-width.',
            'Grip the bar and set the back flat with chest up before pulling.',
        ],
        'lifting': [
            'Drive through the floor and extend hips and knees to stand fully upright.',
            'Shrug the traps slightly at the top and lock the hips out completely.',
        ],
        'lowering': [
            'Hinge at the hips and lower the bar back to the pins with control.',
            'Do not just drop the weight; maintain back tension throughout.',
        ],
        'completion': [
            'Reset completely between reps; rack pulls are a partial-range overload tool, so use heavy loads with full control.',
        ],
    },

    # =========================================================================
    # SHOULDERS
    # =========================================================================
    'overhead press': {
        'muscle_groups': ['Shoulders', 'Triceps', 'Upper Chest'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Hold the bar at the front of the shoulders, grip just outside shoulder width.',
            'Brace the core hard and squeeze the glutes before pressing.',
        ],
        'lifting': [
            'Press the bar straight up, moving the head back slightly then forward once the bar passes the face.',
            'Lock out the elbows fully at the top.',
        ],
        'lowering': [
            'Lower the bar to the front of the shoulders with control, taking 2 seconds.',
            'Do not let the elbows flare; keep them slightly in front of the bar.',
        ],
        'completion': [
            'Maintain a neutral spine throughout; avoid excessive lower back arch.',
        ],
    },
    'dumbbell shoulder press': {
        'muscle_groups': ['Shoulders', 'Triceps'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Sit on an upright bench and hold dumbbells at shoulder height, palms forward.',
            'Keep the core engaged and lower back gently touching the pad.',
        ],
        'lifting': [
            'Press both dumbbells upward and slightly inward until arms are fully extended.',
            'Avoid shrugging the shoulders at the top.',
        ],
        'lowering': [
            'Lower the dumbbells back to shoulder height with control.',
            'Elbows should track forward and slightly out, not flared directly to the side.',
        ],
        'completion': [
            'Keep the movement smooth and symmetrical on both sides.',
        ],
    },
    'lateral raise': {
        'muscle_groups': ['Side Deltoids'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Stand with dumbbells at sides, palms facing in, slight bend in the elbows.',
            'Brace the core and avoid leaning to one side.',
        ],
        'lifting': [
            'Raise both arms out to the sides until level with the shoulders, leading with the elbows.',
            'Tilt the dumbbells slightly as if pouring water from a jug for better delt activation.',
        ],
        'lowering': [
            'Lower the dumbbells slowly back to the sides over 2-3 seconds.',
            'Resist the temptation to drop them quickly; the eccentric phase matters.',
        ],
        'completion': [
            'Avoid shrugging the traps; if you cannot lift without shrugging, reduce the weight.',
        ],
    },
    'front raise': {
        'muscle_groups': ['Front Deltoids', 'Upper Chest'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Stand holding dumbbells in front of the thighs, palms facing the body.',
            'Engage the core and keep a very slight bend in the elbows.',
        ],
        'lifting': [
            'Raise both arms forward to shoulder height, keeping elbows slightly bent.',
            'Avoid swinging the torso for momentum.',
        ],
        'lowering': [
            'Lower the dumbbells back to the thighs with control.',
            'Keep tension in the front delts during the entire descent.',
        ],
        'completion': [
            'Alternate arms to increase time under tension if desired.',
        ],
    },
    'arnold press': {
        'muscle_groups': ['Shoulders', 'Triceps'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Sit on an upright bench holding dumbbells in front of the shoulders, palms facing you.',
            'Keep the core engaged and back supported.',
        ],
        'lifting': [
            'Rotate the palms outward as you press the dumbbells up, finishing with palms forward.',
            'Extend the arms fully at the top.',
        ],
        'lowering': [
            'Reverse the rotation as you lower, returning to palms-facing-in at shoulder height.',
            'Control the rotation through the full range.',
        ],
        'completion': [
            'The rotation recruits more of the delt; do not rush through it.',
        ],
    },
    'cable lateral raise': {
        'muscle_groups': ['Side Deltoids'],
        'equipment': 'Cable Machine',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Set the cable to the lowest position and grip the handle with the hand opposite to the cable.',
            'Stand sideways to the machine, arm slightly in front of the body.',
        ],
        'lifting': [
            'Raise the arm out to the side to shoulder height, leading with the elbow.',
            'Pause at the top for a one-count contraction.',
        ],
        'lowering': [
            'Lower the arm with full control, resisting the cable pull.',
            'Do not let the cable drag the arm down quickly.',
        ],
        'completion': [
            'Complete all reps on one side before switching; cables maintain tension at the bottom unlike dumbbells.',
        ],
    },
    'rear delt fly': {
        'muscle_groups': ['Rear Deltoids', 'Rhomboids'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Hinge forward at the hips to nearly parallel with the floor; hold dumbbells hanging below.',
            'Maintain a flat back and keep the neck neutral.',
        ],
        'lifting': [
            'Raise both arms out to the sides in a wide arc, leading with the elbows.',
            'Squeeze the rear delts and rhomboids at the top.',
        ],
        'lowering': [
            'Lower the dumbbells back down with control, feeling the stretch across the upper back.',
            'Do not let gravity drop them; resist throughout.',
        ],
        'completion': [
            'Use a light weight and focus on the rear delt contraction over load.',
        ],
    },
    'upright row': {
        'muscle_groups': ['Traps', 'Side Deltoids'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Hold the bar with an overhand grip, hands about 8-12 inches apart.',
            'Stand tall with the bar resting against the thighs.',
        ],
        'lifting': [
            'Pull the bar straight up along the body, driving the elbows high and wide.',
            'Lead with the elbows; the hands should finish below chin level.',
        ],
        'lowering': [
            'Lower the bar with control back to the thighs.',
            'Avoid letting the bar swing away from the body on the descent.',
        ],
        'completion': [
            'A wider grip reduces shoulder impingement risk; avoid pulling the bar above chin height.',
        ],
    },
    'machine shoulder press': {
        'muscle_groups': ['Shoulders', 'Triceps'],
        'equipment': 'Machine',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Adjust the seat so the handles are at shoulder height.',
            'Sit tall and grip the handles with palms facing forward.',
        ],
        'lifting': [
            'Press the handles upward until the arms are fully extended.',
            'Avoid shrugging the shoulders at the top.',
        ],
        'lowering': [
            'Lower the handles back to shoulder height under full control.',
            'Feel the shoulder stretch at the bottom position.',
        ],
        'completion': [
            'The machine stabilizes the movement; focus on driving through the shoulders, not the chest.',
        ],
    },
    'plate front raise': {
        'muscle_groups': ['Front Deltoids'],
        'equipment': 'Weight Plate',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Hold a weight plate with both hands at the 3 and 9 o-clock positions.',
            'Stand with feet shoulder-width; plate rests against the thighs.',
        ],
        'lifting': [
            'Raise the plate forward to shoulder height with arms nearly straight.',
            'Keep the core braced and avoid leaning back.',
        ],
        'lowering': [
            'Lower the plate with control back to the thighs.',
            'Resist the weight throughout the descent for full front-delt engagement.',
        ],
        'completion': [
            'Do not sway the torso to help the lift; reduce load if momentum is needed.',
        ],
    },

    # =========================================================================
    # BICEPS
    # =========================================================================
    'barbell curl': {
        'muscle_groups': ['Biceps', 'Forearms'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Stand with feet shoulder-width, holding the bar with an underhand grip at hip width.',
            'Pin the elbows to the sides and keep them there throughout.',
        ],
        'lifting': [
            'Curl the bar upward in a smooth arc until the forearms are nearly vertical.',
            'Squeeze the biceps hard at the top.',
        ],
        'lowering': [
            'Lower the bar slowly over 2-3 seconds, maintaining elbow position.',
            'Extend fully at the bottom to stretch the biceps.',
        ],
        'completion': [
            'Avoid swinging the hips or torso; if you must, reduce the weight.',
        ],
    },
    'dumbbell curl': {
        'muscle_groups': ['Biceps', 'Forearms'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Stand or sit holding dumbbells at sides with palms facing in.',
            'Keep elbows close to the torso.',
        ],
        'lifting': [
            'Supinate the palms as you curl the dumbbells up to shoulder level.',
            'Squeeze the biceps at the top.',
        ],
        'lowering': [
            'Lower with full control, supinating back to neutral at the bottom.',
            'Achieve full arm extension before the next rep.',
        ],
        'completion': [
            'Alternate arms or perform simultaneously; both approaches are valid.',
        ],
    },
    'hammer curl': {
        'muscle_groups': ['Biceps', 'Brachialis', 'Forearms'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Hold dumbbells at the sides with a neutral grip (palms facing the body).',
            'Keep the elbows pinned to the sides.',
        ],
        'lifting': [
            'Curl the dumbbells upward keeping the neutral grip throughout; thumbs point toward the ceiling.',
            'Squeeze at the top.',
        ],
        'lowering': [
            'Lower with control back to full extension.',
            'Resist the dumbbells on the way down; do not just drop them.',
        ],
        'completion': [
            'The neutral grip targets the brachialis heavily; keep the wrist straight throughout.',
        ],
    },
    'preacher curl': {
        'muscle_groups': ['Biceps'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Sit at the preacher bench and place the upper arms fully on the pad.',
            'Grip the bar with an underhand grip, arms extended.',
        ],
        'lifting': [
            'Curl the bar up until the forearms are vertical or slightly past.',
            'Squeeze the biceps at the peak contraction.',
        ],
        'lowering': [
            'Lower the bar slowly to nearly full extension; do not lock out hard at the bottom.',
            'Stopping just short of full extension keeps constant tension on the biceps.',
        ],
        'completion': [
            'The pad locks out torso swing; this isolates the biceps completely.',
        ],
    },
    'concentration curl': {
        'muscle_groups': ['Biceps'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Sit on a bench, lean forward, and brace the working arm elbow against the inner thigh.',
            'Start with the arm extended, dumbbell hanging.',
        ],
        'lifting': [
            'Curl the dumbbell upward, twisting the palm slightly outward at the top.',
            'Hold the peak contraction for one count.',
        ],
        'lowering': [
            'Lower with full control to the extended starting position.',
            'Do not let the dumbbell swing; the thigh braces the elbow.',
        ],
        'completion': [
            'Complete all reps on one arm before switching; this is a pure isolation movement.',
        ],
    },
    'cable curl': {
        'muscle_groups': ['Biceps', 'Forearms'],
        'equipment': 'Cable Machine',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Set the cable to the lowest position with a straight bar or EZ bar attachment.',
            'Stand facing the machine, elbows at sides.',
        ],
        'lifting': [
            'Curl the bar up toward the shoulders, squeezing the biceps at the top.',
            'Keep the elbows stationary throughout.',
        ],
        'lowering': [
            'Lower with control; cables maintain tension at the bottom unlike free weights.',
            'Fully extend the arms on every rep.',
        ],
        'completion': [
            'The constant cable tension is ideal for peak-contraction training.',
        ],
    },
    'incline dumbbell curl': {
        'muscle_groups': ['Biceps', 'Long Head of Biceps'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Set an incline bench to 45-60 degrees and lean back; arms hang straight down.',
            'Hold dumbbells with a supinated grip; the incline puts the biceps on a stretch.',
        ],
        'lifting': [
            'Curl both dumbbells upward, keeping the upper arms perpendicular to the floor.',
            'Squeeze the biceps at the top.',
        ],
        'lowering': [
            'Lower slowly to the hanging position, feeling the full biceps stretch.',
            'The stretched position is a key benefit of this variation; do not rush the descent.',
        ],
        'completion': [
            'Use lighter loads than standard curls; the stretched position makes it significantly harder.',
        ],
    },
    'reverse curl': {
        'muscle_groups': ['Brachialis', 'Forearms', 'Biceps'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Hold the bar with an overhand grip (pronated) at hip width.',
            'Stand tall, elbows at the sides.',
        ],
        'lifting': [
            'Curl the bar upward while keeping the overhand grip throughout.',
            'Squeeze at the top.',
        ],
        'lowering': [
            'Lower slowly to full extension, resisting the bar the whole way.',
            'Keep the wrists straight; avoid bending them under load.',
        ],
        'completion': [
            'This heavily loads the brachialis and forearm extensors; use a lighter load than regular curls.',
        ],
    },
    'spider curl': {
        'muscle_groups': ['Biceps'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Lie chest-down on an incline bench (steep angle), arms hanging perpendicular to the floor.',
            'Hold dumbbells with a supinated grip.',
        ],
        'lifting': [
            'Curl the dumbbells upward, keeping the upper arms vertical and stationary.',
            'Squeeze hard at peak contraction.',
        ],
        'lowering': [
            'Lower to full extension slowly; the perpendicular arm angle creates constant tension.',
            'Resist the weight throughout the descent.',
        ],
        'completion': [
            'The strict arm position eliminates all cheating; use controlled loads only.',
        ],
    },
    'zottman curl': {
        'muscle_groups': ['Biceps', 'Brachialis', 'Forearms'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Stand holding dumbbells at the sides with a supinated (underhand) grip.',
            'Keep elbows pinned to the sides.',
        ],
        'lifting': [
            'Curl the dumbbells upward with a supinated grip to the top.',
            'At the top, rotate the palms to a pronated (overhand) grip.',
        ],
        'lowering': [
            'Lower the dumbbells slowly with the overhand grip to full extension.',
            'At the bottom, rotate back to the supinated grip.',
        ],
        'completion': [
            'The pronated descent trains the forearm extensors and brachialis; do not skip the rotation.',
        ],
    },

    # =========================================================================
    # TRICEPS
    # =========================================================================
    'tricep dip': {
        'muscle_groups': ['Triceps', 'Chest', 'Shoulders'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'intermediate',
        'setup': [
            'Grip parallel bars, arms extended, body upright with a slight forward lean.',
            'Cross the feet and engage the core.',
        ],
        'lifting': [
            'Push through the palms to extend the elbows fully, locking out at the top.',
            'Keep the torso upright to emphasize the triceps over the chest.',
        ],
        'lowering': [
            'Lower until the upper arms are at least parallel to the floor, taking 2-3 seconds.',
            'Control the descent and avoid letting the shoulders roll forward.',
        ],
        'completion': [
            'Add weight via a dip belt once bodyweight dips become easy.',
        ],
    },
    'skull crusher': {
        'muscle_groups': ['Triceps'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Lie flat on a bench; press a barbell or EZ bar to arm-extended position above the chest.',
            'Keep the upper arms vertical and perpendicular to the torso.',
        ],
        'lifting': [
            'Extend the elbows to press the bar back to the starting position.',
            'Keep the upper arms stationary throughout.',
        ],
        'lowering': [
            'Bend the elbows to lower the bar toward the forehead or slightly behind the head.',
            'Lower slowly and under control; the name is a reminder of what happens otherwise.',
        ],
        'completion': [
            'Have a spotter present for heavy sets; the bar path goes directly over the face.',
        ],
    },
    'tricep pushdown': {
        'muscle_groups': ['Triceps'],
        'equipment': 'Cable Machine',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Set the cable to the top position with a straight bar or rope; stand facing the machine.',
            'Grip the attachment and pin the elbows to the sides.',
        ],
        'lifting': [
            'Push the bar down until the elbows are fully extended.',
            'Squeeze the triceps hard at the bottom.',
        ],
        'lowering': [
            'Allow the attachment to rise until the forearms are nearly horizontal, maintaining elbow position.',
            'Resist the cable on the way up.',
        ],
        'completion': [
            'Keep the upper arms locked in place; only the forearms should move.',
        ],
    },
    'overhead tricep extension': {
        'muscle_groups': ['Triceps', 'Long Head of Triceps'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Hold one dumbbell with both hands overhead, arms fully extended.',
            'Stand or sit with a braced core and avoid excessive lower back arch.',
        ],
        'lifting': [
            'Extend the elbows to press the dumbbell back overhead.',
            'Keep the upper arms close to the ears and stationary.',
        ],
        'lowering': [
            'Bend the elbows to lower the dumbbell behind the head, feeling the triceps stretch.',
            'Lower slowly to the point of a comfortable stretch.',
        ],
        'completion': [
            'The overhead position stretches the long head of the triceps, enabling greater activation.',
        ],
    },
    'close-grip bench press': {
        'muscle_groups': ['Triceps', 'Chest', 'Shoulders'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Lie flat on the bench; grip the bar with hands about shoulder width apart.',
            'Unrack and hold the bar directly above the chest.',
        ],
        'lifting': [
            'Press the bar straight up, fully extending the elbows.',
            'Keep the elbows tucked close to the body throughout.',
        ],
        'lowering': [
            'Lower the bar to the lower chest in a controlled movement.',
            'Elbows should track back along the body, not flare out.',
        ],
        'completion': [
            'Do not use a grip too narrow; shoulder-width is optimal to avoid wrist strain.',
        ],
    },
    'diamond push-up': {
        'muscle_groups': ['Triceps', 'Chest'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'intermediate',
        'setup': [
            'Form a diamond shape with the thumbs and index fingers; place hands on the floor below the chest.',
            'Assume a full plank position with the core and glutes engaged.',
        ],
        'lifting': [
            'Push through the palms to extend the elbows fully.',
            'Keep the elbows tucked close throughout.',
        ],
        'lowering': [
            'Lower the chest toward the hands, bending the elbows straight back.',
            'Lower until the chest is just above the hands.',
        ],
        'completion': [
            'The narrow hand position places significant load on the triceps; use full range of motion.',
        ],
    },
    'cable overhead tricep extension': {
        'muscle_groups': ['Triceps', 'Long Head of Triceps'],
        'equipment': 'Cable Machine',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Set the cable to the top position with a rope; face away from the machine.',
            'Hold the rope behind the head with elbows pointing up.',
        ],
        'lifting': [
            'Extend the elbows to press the rope forward and upward overhead.',
            'Squeeze the triceps at full extension.',
        ],
        'lowering': [
            'Bend the elbows to return the rope behind the head, feeling the triceps stretch.',
            'Keep the upper arms stationary throughout the movement.',
        ],
        'completion': [
            'Cables maintain tension at the stretched position, making this superior to free weights for the long head.',
        ],
    },
    'tricep kickback': {
        'muscle_groups': ['Triceps'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Hinge forward at the hips; hold a dumbbell with the upper arm parallel to the floor.',
            'Pin the upper arm at the side and keep it stationary.',
        ],
        'lifting': [
            'Extend the elbow to kick the dumbbell back until the arm is straight.',
            'Squeeze the triceps hard at full extension.',
        ],
        'lowering': [
            'Bend the elbow to return the dumbbell to the starting position with control.',
            'Do not let the dumbbell swing.',
        ],
        'completion': [
            'Use a light load; heavy kickbacks cause the upper arm to drop, defeating the exercise.',
        ],
    },

    # =========================================================================
    # QUADS
    # =========================================================================
    'squat': {
        'muscle_groups': ['Quads', 'Glutes', 'Hamstrings', 'Core'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Position the bar on the upper traps (high bar) or rear delts (low bar); feet shoulder-width, toes slightly out.',
            'Unrack, brace the core hard, and squeeze the lats.',
        ],
        'lifting': [
            'Drive through the full foot to stand, extending hips and knees simultaneously.',
            'Keep the chest up and knees tracking over the toes throughout.',
        ],
        'lowering': [
            'Break at the hips and knees simultaneously, descending until thighs are at least parallel.',
            'Keep the knees out and the torso as upright as possible.',
        ],
        'completion': [
            'Re-rack with full control; walk back into the rack rather than dropping the bar.',
        ],
    },
    'leg press': {
        'muscle_groups': ['Quads', 'Glutes', 'Hamstrings'],
        'equipment': 'Machine',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Sit with back fully against the pad; place feet shoulder-width on the platform.',
            'Unlock the safety handles before pressing.',
        ],
        'lifting': [
            'Extend the knees and hips to press the platform away, stopping just short of locking out.',
            'Keep the lower back pressed against the seat throughout.',
        ],
        'lowering': [
            'Lower the platform slowly until the knees are at roughly 90 degrees or comfortable depth.',
            'Do not let the lower back peel off the pad at the bottom.',
        ],
        'completion': [
            'Engage the safety handles before removing your feet from the platform.',
        ],
    },
    'leg extension': {
        'muscle_groups': ['Quads'],
        'equipment': 'Machine',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Adjust the machine so the pad rests on the lower shin and the seat back supports the knees at the pivot.',
            'Sit tall and grip the handles.',
        ],
        'lifting': [
            'Extend the knees to raise the pad until the legs are straight.',
            'Squeeze the quads hard at full extension and hold briefly.',
        ],
        'lowering': [
            'Lower the pad with control back to the starting position.',
            'Do not let the weight stack slam.',
        ],
        'completion': [
            'This is a pure quad isolation movement; it does not require heavy loads to be effective.',
        ],
    },
    'bulgarian split squat': {
        'muscle_groups': ['Quads', 'Glutes', 'Hamstrings'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'advanced',
        'setup': [
            'Place the rear foot on a bench behind you; step the front foot far enough forward so the knee stays behind the toes.',
            'Hold dumbbells at sides or a barbell on the back.',
        ],
        'lifting': [
            'Drive through the front heel to stand, extending the front hip and knee.',
            'Keep the torso upright and front knee tracking over the toes.',
        ],
        'lowering': [
            'Lower the rear knee toward the floor by bending the front knee and hip.',
            'Descend until the front thigh is at least parallel.',
        ],
        'completion': [
            'Complete all reps on one leg before switching; this unilateral work addresses imbalances.',
        ],
    },
    'hack squat': {
        'muscle_groups': ['Quads', 'Glutes'],
        'equipment': 'Machine',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Position shoulders under the shoulder pads with back flat against the sled.',
            'Place feet shoulder-width with a slight toe-out on the platform.',
        ],
        'lifting': [
            'Push through the full foot to extend the knees, stopping just short of lockout.',
            'Keep the lower back pressed into the pad.',
        ],
        'lowering': [
            'Bend the knees to lower the sled until thighs reach at least parallel.',
            'Keep the heels on the platform; do not let them rise.',
        ],
        'completion': [
            'Engage the safety stops before removing feet from the platform.',
        ],
    },
    'front squat': {
        'muscle_groups': ['Quads', 'Core', 'Upper Back'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'advanced',
        'setup': [
            'Rest the bar on the front delts in a clean grip or cross-arm position; elbows high.',
            'Feet shoulder-width, toes slightly out; keep elbows up throughout.',
        ],
        'lifting': [
            'Drive through the heels to stand while keeping an upright torso.',
            'Maintain high elbows to prevent the bar from rolling forward.',
        ],
        'lowering': [
            'Sit straight down keeping the torso vertical; elbows must stay up.',
            'Descend to at least parallel while keeping the heels on the floor.',
        ],
        'completion': [
            'Front squats demand significantly more upper back and core strength than back squats.',
        ],
    },
    'goblet squat': {
        'muscle_groups': ['Quads', 'Glutes', 'Core'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Hold a dumbbell or kettlebell vertically at chest height with both hands.',
            'Stand with feet slightly wider than shoulder-width, toes out.',
        ],
        'lifting': [
            'Drive through the heels to stand, keeping the weight close to the chest.',
            'Maintain an upright torso throughout.',
        ],
        'lowering': [
            'Sit between the heels, lowering until thighs are at least parallel.',
            'Let the elbows track inside the knees to encourage them to stay out.',
        ],
        'completion': [
            'The goblet squat is an excellent technique teaching tool for the squat pattern.',
        ],
    },
    'step-up': {
        'muscle_groups': ['Quads', 'Glutes'],
        'equipment': 'Dumbbell',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Stand facing a sturdy box or bench; hold dumbbells at sides.',
            'Place the entire working foot flat on the box surface.',
        ],
        'lifting': [
            'Press through the heel of the elevated foot to step fully onto the box.',
            'Stand tall at the top, then bring the trailing leg up.',
        ],
        'lowering': [
            'Step the trailing leg back down to the floor with control.',
            'Lower with the working leg; do not just fall back to the floor.',
        ],
        'completion': [
            'Complete all reps on one leg before switching to prevent momentum-driven stepping.',
        ],
    },
    'wall sit': {
        'muscle_groups': ['Quads', 'Glutes'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'beginner',
        'setup': [
            'Lean back against a wall and walk the feet out until the knees are at 90 degrees.',
            'Keep the back flat against the wall throughout.',
        ],
        'lifting': [],
        'lowering': [],
        'completion': [
            'Hold the position for the target duration; squeeze the quads hard to maintain depth.',
        ],
    },
    'sissy squat': {
        'muscle_groups': ['Quads'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'advanced',
        'setup': [
            'Hold a fixed support for balance; stand on the balls of the feet.',
            'Keep the hips and torso in a straight line throughout.',
        ],
        'lifting': [
            'Drive through the balls of the feet to rise back to the start.',
            'Keep the hips extended and the torso and thighs aligned.',
        ],
        'lowering': [
            'Lean the entire body back as a unit, bending only at the knees.',
            'Lower until you feel a strong quad stretch or the knees are near the floor.',
        ],
        'completion': [
            'This is a high-demand knee exercise; build gradually and avoid if there is knee pain.',
        ],
    },
    'lunges': {
        'muscle_groups': ['Quads', 'Glutes', 'Hamstrings'],
        'equipment': 'Bodyweight',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Stand tall, feet together, core engaged.',
            'Step forward with one foot far enough that the rear knee can lower straight down.',
        ],
        'lifting': [
            'Push through the front heel to drive the body back to the starting position.',
            'Keep the torso upright and the front knee tracking over the toes.',
        ],
        'lowering': [
            'Lower the rear knee toward the floor until both knees are at roughly 90 degrees.',
            'The front shin should remain vertical throughout.',
        ],
        'completion': [
            'Alternate legs each rep or complete all reps on one leg before switching.',
        ],
    },
    'walking lunges': {
        'muscle_groups': ['Quads', 'Glutes', 'Hamstrings'],
        'equipment': 'Bodyweight',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Stand tall and hold dumbbells at sides or hands on hips.',
            'Begin with feet together and take a long stride forward.',
        ],
        'lifting': [
            'Push through the front heel to rise and step the rear foot forward into the next lunge.',
            'Keep momentum controlled; do not bounce off the front leg.',
        ],
        'lowering': [
            'Lower the rear knee toward the floor with control after each forward step.',
            'Maintain an upright torso; avoid leaning forward excessively.',
        ],
        'completion': [
            'Cover the designated distance or rep count; maintain equal stride length on both sides.',
        ],
    },

    # =========================================================================
    # HAMSTRINGS
    # =========================================================================
    'romanian deadlift': {
        'muscle_groups': ['Hamstrings', 'Glutes', 'Lower Back'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Stand holding the bar at hip level with an overhand grip, feet hip-width apart.',
            'Maintain a slight bend in the knees throughout the movement.',
        ],
        'lifting': [
            'Drive the hips forward to return to the standing position, squeezing the glutes at the top.',
            'Do not hyperextend the lower back at lockout.',
        ],
        'lowering': [
            'Push the hips back and lower the bar along the legs until you feel a strong hamstring stretch.',
            'Keep the back flat and the bar close to the body at all times.',
        ],
        'completion': [
            'The RDL is a hip-hinge movement, not a back exercise; initiate and finish at the hips.',
        ],
    },
    'lying leg curl': {
        'muscle_groups': ['Hamstrings'],
        'equipment': 'Machine',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Lie face-down on the machine with the pad just above the heel.',
            'Keep the hips pressed into the bench and grip the handles lightly.',
        ],
        'lifting': [
            'Curl the pad toward the glutes by contracting the hamstrings.',
            'Squeeze hard at full flexion.',
        ],
        'lowering': [
            'Lower the pad with full control back to the extended position.',
            'Do not let the weight slam down.',
        ],
        'completion': [
            'Keep the hips pinned; rising hips reduce hamstring tension and increase lower-back stress.',
        ],
    },
    'seated leg curl': {
        'muscle_groups': ['Hamstrings'],
        'equipment': 'Machine',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Sit in the machine with the back pad supporting the lower back and the leg pad resting above the heel.',
            'Adjust so the knee pivot aligns with the machine pivot.',
        ],
        'lifting': [
            'Curl the leg pad down by flexing the hamstrings.',
            'Squeeze at full contraction.',
        ],
        'lowering': [
            'Extend the legs back to the starting position under control.',
            'Resist the weight throughout the return.',
        ],
        'completion': [
            'The seated position puts the hamstrings at a greater stretch than lying curls, increasing activation.',
        ],
    },
    'nordic hamstring curl': {
        'muscle_groups': ['Hamstrings'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'advanced',
        'setup': [
            'Kneel on a pad with feet anchored under a secure surface at ankle level.',
            'Keep the body in a straight line from knees to head, arms ready to catch.',
        ],
        'lifting': [
            'Use the hamstrings to pull the body back up to the kneeling position.',
            'A push off the floor is allowed to assist at the start; aim to reduce this over time.',
        ],
        'lowering': [
            'Lower the body toward the floor as slowly as possible by extending the knees.',
            'Fight gravity with the hamstrings the entire way down.',
        ],
        'completion': [
            'Nordic curls are one of the most effective hamstring injury-prevention exercises; progress slowly.',
        ],
    },
    'stiff-leg deadlift': {
        'muscle_groups': ['Hamstrings', 'Glutes', 'Lower Back'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Hold the bar at hip level; keep the legs straighter than in an RDL with only a minimal knee bend.',
            'Set the back flat and engage the lats.',
        ],
        'lifting': [
            'Drive the hips through to return to standing, squeezing the glutes at the top.',
            'Keep the bar close to the legs throughout.',
        ],
        'lowering': [
            'Hinge at the hips and lower the bar toward the floor, keeping the legs nearly straight.',
            'Lower until the hamstrings are fully stretched; do not round the lower back to go deeper.',
        ],
        'completion': [
            'The straighter leg position increases the hamstring stretch compared to the RDL.',
        ],
    },
    'good morning': {
        'muscle_groups': ['Hamstrings', 'Glutes', 'Lower Back'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'advanced',
        'setup': [
            'Place the bar on the upper back as for a squat; feet shoulder-width.',
            'Maintain a slight, fixed bend in the knees.',
        ],
        'lifting': [
            'Drive the hips forward and rise back to standing by contracting the hamstrings and glutes.',
            'Keep the back flat through the full range.',
        ],
        'lowering': [
            'Push the hips back and hinge forward at the hips until the torso is nearly parallel to the floor.',
            'Maintain a rigid, flat back throughout the descent.',
        ],
        'completion': [
            'This exercise places significant demand on the lower back; use light loads and perfect form.',
        ],
    },
    'swiss ball hamstring curl': {
        'muscle_groups': ['Hamstrings', 'Glutes', 'Core'],
        'equipment': 'Swiss Ball',
        'category': 'Bodyweight',
        'difficulty': 'intermediate',
        'setup': [
            'Lie on your back with heels resting on a Swiss ball and arms flat on the floor at sides.',
            'Lift the hips into a bridge position, supported by the shoulders and heels.',
        ],
        'lifting': [
            'Curl the ball toward the glutes by flexing the knees while maintaining the hip bridge.',
            'Squeeze the hamstrings and glutes at full curl.',
        ],
        'lowering': [
            'Roll the ball back out by extending the knees, keeping the hips elevated.',
            'Control the ball on the way out; do not let it roll freely.',
        ],
        'completion': [
            'If the hips drop during the curl, the exercise is too challenging; reduce difficulty by using a closer ball.',
        ],
    },

    # =========================================================================
    # GLUTES
    # =========================================================================
    'hip thrust': {
        'muscle_groups': ['Glutes', 'Hamstrings'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Sit on the floor with the upper back against a bench edge and the barbell across the hips.',
            'Feet flat on the floor, shoulder-width, knees bent at roughly 90 degrees at the top.',
        ],
        'lifting': [
            'Drive through the heels to thrust the hips upward until the body forms a straight line.',
            'Squeeze the glutes maximally at the top and hold briefly.',
        ],
        'lowering': [
            'Lower the hips toward the floor with control without fully touching down between reps.',
            'Maintain constant tension in the glutes throughout the set.',
        ],
        'completion': [
            'Use a barbell pad for comfort on heavy loads; chin slightly tucked avoids lower back hyperextension.',
        ],
    },
    'glute bridge': {
        'muscle_groups': ['Glutes', 'Hamstrings', 'Core'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'beginner',
        'setup': [
            'Lie on your back with knees bent, feet flat on the floor close to the glutes.',
            'Arms flat at sides for stability.',
        ],
        'lifting': [
            'Push through the heels to lift the hips until the body forms a straight line from knees to shoulders.',
            'Squeeze the glutes hard at the top.',
        ],
        'lowering': [
            'Lower the hips back to the floor with control.',
            'Briefly touch the floor and immediately repeat without fully relaxing.',
        ],
        'completion': [
            'Add a resistance band above the knees or a plate on the hips for progressive overload.',
        ],
    },
    'cable kickback': {
        'muscle_groups': ['Glutes'],
        'equipment': 'Cable Machine',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Attach an ankle strap to the low cable and to the working leg; face the machine.',
            'Hold the machine for balance; hinge slightly at the hips.',
        ],
        'lifting': [
            'Kick the working leg straight back by contracting the glute.',
            'Squeeze hard at the top and avoid rotating the hip outward.',
        ],
        'lowering': [
            'Lower the leg with control back to the starting position.',
            'Do not let the cable pull the leg forward without resistance.',
        ],
        'completion': [
            'Complete all reps on one side before switching; keep the movement isolated to the hip.',
        ],
    },
    'sumo deadlift': {
        'muscle_groups': ['Glutes', 'Hamstrings', 'Adductors', 'Lower Back'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'advanced',
        'setup': [
            'Set feet very wide (sumo stance) with toes pointed out significantly; hands grip inside the legs.',
            'Push the knees out over the toes, set the back flat, and engage the lats.',
        ],
        'lifting': [
            'Push the floor apart with the feet while extending the hips and knees simultaneously.',
            'Stand fully upright with hips locked out.',
        ],
        'lowering': [
            'Hinge at the hips and bend the knees to lower the bar to the floor with control.',
            'Keep the knees pushed out and the back flat throughout the descent.',
        ],
        'completion': [
            'The wide stance shifts more emphasis to the glutes and adductors compared to conventional deadlift.',
        ],
    },
    'donkey kick': {
        'muscle_groups': ['Glutes'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'beginner',
        'setup': [
            'Start on all fours with wrists under shoulders and knees under hips.',
            'Keep a 90-degree bend in the working knee throughout.',
        ],
        'lifting': [
            'Lift the knee off the floor and kick the heel toward the ceiling by squeezing the glute.',
            'Hold at the top for one count.',
        ],
        'lowering': [
            'Lower the knee back toward the floor without touching it between reps.',
            'Keep the pelvis square; do not rotate the hips.',
        ],
        'completion': [
            'Complete all reps on one side before switching; add a resistance band for overload.',
        ],
    },
    'banded clamshell': {
        'muscle_groups': ['Glutes', 'Hip Abductors'],
        'equipment': 'Resistance Band',
        'category': 'Bodyweight',
        'difficulty': 'beginner',
        'setup': [
            'Place a resistance band just above the knees; lie on your side with hips stacked.',
            'Bend the knees to roughly 45 degrees, keeping the feet together.',
        ],
        'lifting': [
            'Open the top knee toward the ceiling as far as possible without rotating the hips.',
            'Squeeze the glute med at the top of the movement.',
        ],
        'lowering': [
            'Lower the knee back to the starting position with control, resisting the band.',
            'Do not let the band snap the leg down.',
        ],
        'completion': [
            'Complete all reps on one side before switching; this targets the gluteus medius for hip stability.',
        ],
    },
    'single-leg hip thrust': {
        'muscle_groups': ['Glutes', 'Hamstrings', 'Core'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'intermediate',
        'setup': [
            'Set up as for a regular hip thrust with upper back on the bench.',
            'Extend one leg straight out and drive only through the planted foot.',
        ],
        'lifting': [
            'Thrust the hips upward to a straight line, squeezing the glute of the planted leg maximally.',
            'Keep the extended leg level; do not let it drop.',
        ],
        'lowering': [
            'Lower the hips toward the floor with control.',
            'Maintain the extended leg position throughout.',
        ],
        'completion': [
            'Complete all reps on one side before switching; this significantly increases the demand on each glute.',
        ],
    },

    # =========================================================================
    # CALVES
    # =========================================================================
    'standing calf raise': {
        'muscle_groups': ['Gastrocnemius', 'Soleus'],
        'equipment': 'Machine',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Place the balls of the feet on the edge of the platform with heels free to move.',
            'Position the shoulder pads over the traps and stand at full height.',
        ],
        'lifting': [
            'Rise up onto the balls of the feet as high as possible.',
            'Squeeze the calves maximally at the top.',
        ],
        'lowering': [
            'Lower the heels below the platform level to achieve a full calf stretch.',
            'Hold the stretched position for one count before the next rep.',
        ],
        'completion': [
            'Slow, full-range reps are more effective than fast partial reps for calf development.',
        ],
    },
    'seated calf raise': {
        'muscle_groups': ['Soleus', 'Gastrocnemius'],
        'equipment': 'Machine',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Sit with the knees bent at 90 degrees and the knee pad positioned over the lower thigh.',
            'Place the balls of the feet on the step with heels hanging.',
        ],
        'lifting': [
            'Press through the balls of the feet to raise the heels as high as possible.',
            'Squeeze the calves at the top.',
        ],
        'lowering': [
            'Lower the heels as far as possible for a full stretch.',
            'Pause at the bottom before the next rep.',
        ],
        'completion': [
            'The bent-knee position de-emphasizes the gastrocnemius and isolates the soleus.',
        ],
    },
    'single-leg calf raise': {
        'muscle_groups': ['Gastrocnemius', 'Soleus'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'intermediate',
        'setup': [
            'Stand on the ball of one foot on a step edge, holding a wall for light balance support.',
            'Keep the working leg straight.',
        ],
        'lifting': [
            'Rise up as high as possible on the ball of the foot.',
            'Squeeze the calf hard at the top.',
        ],
        'lowering': [
            'Lower the heel below the step as far as possible for a full stretch.',
            'Take 3 seconds to lower.',
        ],
        'completion': [
            'Complete all reps on one foot before switching; single-leg variation doubles the load per calf.',
        ],
    },
    'tibialis raise': {
        'muscle_groups': ['Tibialis Anterior'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'beginner',
        'setup': [
            'Lean back against a wall with heels about 12 inches from the wall.',
            'Stand with legs straight.',
        ],
        'lifting': [
            'Dorsiflex the feet by raising the toes toward the shins as high as possible.',
            'Squeeze the tibialis at the top.',
        ],
        'lowering': [
            'Lower the toes back to the floor with control.',
            'Full range of motion is key; go as low as possible.',
        ],
        'completion': [
            'Often overlooked, the tibialis anterior is critical for shin splint prevention and ankle stability.',
        ],
    },
    'donkey calf raise': {
        'muscle_groups': ['Gastrocnemius', 'Soleus'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'intermediate',
        'setup': [
            'Hinge forward at the hips to about 90 degrees, holding a support; balls of the feet on a raised surface.',
            'Keep the back flat and the hips directly above the heels.',
        ],
        'lifting': [
            'Rise up onto the balls of the feet as high as possible.',
            'Squeeze the calves at the top.',
        ],
        'lowering': [
            'Lower the heels as far below the platform as flexibility allows for a deep calf stretch.',
            'Hold the bottom briefly.',
        ],
        'completion': [
            'The hip-hinge position stretches the gastrocnemius further than standing raises, increasing range and activation.',
        ],
    },

    # =========================================================================
    # CORE
    # =========================================================================
    'plank': {
        'muscle_groups': ['Core', 'Shoulders', 'Glutes'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'beginner',
        'setup': [
            'Place forearms on the floor, elbows under the shoulders; toes on the floor.',
            'Engage the core, glutes, and quads before lifting the body.',
        ],
        'lifting': [],
        'lowering': [],
        'completion': [
            'Hold for the target duration; if the hips sag or pike, end the set and rest.',
        ],
    },
    'crunch': {
        'muscle_groups': ['Rectus Abdominis'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'beginner',
        'setup': [
            'Lie on your back with knees bent and feet flat on the floor.',
            'Place hands lightly behind the ears or cross them on the chest.',
        ],
        'lifting': [
            'Curl the shoulders off the floor by contracting the abs, bringing the ribs toward the hips.',
            'Exhale forcefully at the top of the movement.',
        ],
        'lowering': [
            'Lower the shoulders back to the floor with control.',
            'Do not let the head drop and bounce off the floor.',
        ],
        'completion': [
            'The crunch is a short-range movement; quality contraction matters more than height.',
        ],
    },
    'hanging leg raise': {
        'muscle_groups': ['Rectus Abdominis', 'Hip Flexors', 'Core'],
        'equipment': 'Pull-Up Bar',
        'category': 'Bodyweight',
        'difficulty': 'intermediate',
        'setup': [
            'Hang from a pull-up bar with an overhand grip, shoulders depressed.',
            'Engage the core before starting.',
        ],
        'lifting': [
            'Raise the legs by flexing the hips and, for a full rep, curl the pelvis upward at the top.',
            'Aim to bring the legs to at least horizontal or higher.',
        ],
        'lowering': [
            'Lower the legs with control, resisting gravity all the way down.',
            'Do not swing; controlled eccentrics are key.',
        ],
        'completion': [
            'Avoid swinging the body; if you cannot stop the swing, practice hanging knee raises first.',
        ],
    },
    'cable crunch': {
        'muscle_groups': ['Rectus Abdominis'],
        'equipment': 'Cable Machine',
        'category': 'Strength',
        'difficulty': 'beginner',
        'setup': [
            'Kneel in front of a high cable pulley with a rope attachment; hold the rope at the sides of the head.',
            'Hinge forward slightly at the hips before starting.',
        ],
        'lifting': [
            'Crunch downward by flexing the spine, bringing the elbows toward the knees.',
            'Squeeze the abs hard at the bottom.',
        ],
        'lowering': [
            'Extend back up with control, resisting the cable the whole way.',
            'Do not use the hip flexors to pull; the movement should come entirely from the abs.',
        ],
        'completion': [
            'The cable allows progressive overload for abs, making this superior to bodyweight crunches over time.',
        ],
    },
    'russian twist': {
        'muscle_groups': ['Obliques', 'Rectus Abdominis', 'Core'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'beginner',
        'setup': [
            'Sit on the floor, lean back slightly with feet elevated or flat, holding hands together or a weight.',
            'Keep the chest up and the lower back in a neutral curve.',
        ],
        'lifting': [
            'Rotate the torso to one side, bringing the hands or weight beside the hip.',
            'Rotate to the other side for one full rep.',
        ],
        'lowering': [
            'Control the rotation in both directions; do not let momentum carry you.',
            'Keep the feet steady and the torso at a consistent lean angle.',
        ],
        'completion': [
            'Each full left-right cycle counts as one rep; focus on rotational contraction, not just arm swinging.',
        ],
    },
    'ab wheel rollout': {
        'muscle_groups': ['Rectus Abdominis', 'Obliques', 'Shoulders'],
        'equipment': 'Ab Wheel',
        'category': 'Bodyweight',
        'difficulty': 'advanced',
        'setup': [
            'Kneel on a mat holding the ab wheel with both hands directly below the shoulders.',
            'Brace the core hard before rolling.',
        ],
        'lifting': [
            'Pull the wheel back toward the knees by contracting the abs forcefully.',
            'Keep the hips level; do not let them drop or pike.',
        ],
        'lowering': [
            'Roll the wheel forward, extending the arms as far as possible while keeping a neutral spine.',
            'Lower until the arms are extended in front without the lower back arching.',
        ],
        'completion': [
            'Start with partial rollouts; full rollouts are extremely demanding and require significant core strength.',
        ],
    },
    'side plank': {
        'muscle_groups': ['Obliques', 'Core', 'Shoulders'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'beginner',
        'setup': [
            'Lie on one side and prop the body up on the forearm, stacking feet on top of each other.',
            'Lift the hips to form a straight line from head to feet.',
        ],
        'lifting': [],
        'lowering': [],
        'completion': [
            'Hold for the target duration; if the hips sag, end the set. Switch sides after completing.',
        ],
    },
    'bicycle crunch': {
        'muscle_groups': ['Obliques', 'Rectus Abdominis'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'beginner',
        'setup': [
            'Lie on your back with hands lightly behind the ears, feet off the floor, knees bent.',
            'Do not pull on the neck.',
        ],
        'lifting': [
            'Rotate one elbow toward the opposite knee while extending the other leg.',
            'Alternate sides in a smooth, controlled pedaling motion.',
        ],
        'lowering': [
            'Return each elbow and knee to center before rotating to the other side.',
            'Avoid jerking the head with the hands.',
        ],
        'completion': [
            'Slow, deliberate reps activate the obliques better than fast, momentum-driven reps.',
        ],
    },
    'dead bug': {
        'muscle_groups': ['Core', 'Transverse Abdominis'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'beginner',
        'setup': [
            'Lie on your back; press the lower back firmly into the floor and maintain that contact throughout.',
            'Raise arms straight above the chest and lift knees to 90 degrees.',
        ],
        'lifting': [
            'Return the opposite arm and leg to the starting position.',
            'Keep the lower back pressed to the floor at all times.',
        ],
        'lowering': [
            'Slowly lower one arm overhead and the opposite leg toward the floor simultaneously.',
            'Do not let the lower back arch off the floor.',
        ],
        'completion': [
            'The lower back remaining flat is the key cue; if it lifts, reduce the range of motion.',
        ],
    },
    'pallof press': {
        'muscle_groups': ['Obliques', 'Core', 'Shoulders'],
        'equipment': 'Cable Machine',
        'category': 'Strength',
        'difficulty': 'intermediate',
        'setup': [
            'Set a cable at chest height; stand sideways to the machine and hold the handle at the sternum.',
            'Assume a shoulder-width stance and brace the core hard.',
        ],
        'lifting': [
            'Press the handle straight out in front of the chest until the arms are extended.',
            'Resist the cable rotation the entire time; the body should not twist.',
        ],
        'lowering': [
            'Pull the handle back to the chest with control.',
            'Maintain a square stance; do not rotate the hips or shoulders.',
        ],
        'completion': [
            'This is an anti-rotation exercise; the goal is to prevent movement, not produce it.',
        ],
    },
    'dragon flag': {
        'muscle_groups': ['Rectus Abdominis', 'Core', 'Hip Flexors'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'advanced',
        'setup': [
            'Lie on a bench and grip the bench behind the head for stability.',
            'Curl the body up into a shoulder-supported vertical position to begin.',
        ],
        'lifting': [
            'Contract the entire core to raise the body back toward the vertical starting position.',
            'Keep the body rigid as a board; no bend at the hips.',
        ],
        'lowering': [
            'Lower the body as a rigid plank toward the bench, stopping just above it.',
            'Do not let the hips sag; the body must remain in a straight line.',
        ],
        'completion': [
            'This is one of the most demanding core exercises; build up to it with tuck dragon flags first.',
        ],
    },
    'l-sit': {
        'muscle_groups': ['Core', 'Hip Flexors', 'Triceps', 'Shoulders'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'advanced',
        'setup': [
            'Support the body on parallel bars or the floor with locked-out arms.',
            'Depress the shoulders actively by pressing down into the surface.',
        ],
        'lifting': [],
        'lowering': [],
        'completion': [
            'Hold the legs parallel to the floor for the target duration; build up using tucked or single-leg progressions.',
        ],
    },
    'decline crunch': {
        'muscle_groups': ['Rectus Abdominis'],
        'equipment': 'Bodyweight',
        'category': 'Bodyweight',
        'difficulty': 'intermediate',
        'setup': [
            'Hook feet under the pad of a decline bench and lie back with hands behind the ears.',
            'The decline angle increases the range of motion and difficulty.',
        ],
        'lifting': [
            'Crunch upward, bringing the shoulders toward the knees.',
            'Exhale and squeeze the abs at the top.',
        ],
        'lowering': [
            'Lower back toward the bench with control; stop just before the shoulders touch.',
            'Keep constant tension in the abs throughout the set.',
        ],
        'completion': [
            'Add a plate to the chest for progressive overload as bodyweight becomes easy.',
        ],
    },

    # =========================================================================
    # FULL BODY
    # =========================================================================
    'burpee': {
        'muscle_groups': ['Full Body', 'Cardio'],
        'equipment': 'Bodyweight',
        'category': 'Cardio',
        'difficulty': 'intermediate',
        'setup': [
            'Stand tall with feet shoulder-width apart.',
            'Prepare for a fast, coordinated movement sequence.',
        ],
        'lifting': [
            'From the bottom of the push-up, jump the feet forward to the hands, then leap explosively upward with arms overhead.',
            'Land softly with bent knees.',
        ],
        'lowering': [
            'Squat down, place the hands on the floor, and jump or step the feet back to a push-up position.',
            'Lower the chest to the floor in a controlled push-up.',
        ],
        'completion': [
            'Move continuously for the target rep or time count; scale by stepping instead of jumping.',
        ],
    },
    'kettlebell swing': {
        'muscle_groups': ['Glutes', 'Hamstrings', 'Core', 'Shoulders'],
        'equipment': 'Kettlebell',
        'category': 'Cardio',
        'difficulty': 'intermediate',
        'setup': [
            'Stand with feet slightly wider than hip-width, kettlebell on the floor in front.',
            'Hike the kettlebell back between the legs with a flat back.',
        ],
        'lifting': [
            'Drive the hips explosively forward to swing the kettlebell to chest or overhead height.',
            'Power comes from the hip snap, not the shoulders.',
        ],
        'lowering': [
            'Let the kettlebell swing back down and guide it between the legs.',
            'Hinge at the hips and absorb the load in the hamstrings.',
        ],
        'completion': [
            'The swing is a ballistic hip-hinge; avoid squatting the movement or pulling with the arms.',
        ],
    },
    'rowing machine': {
        'muscle_groups': ['Back', 'Legs', 'Core', 'Shoulders'],
        'equipment': 'Rowing Machine',
        'category': 'Cardio',
        'difficulty': 'beginner',
        'setup': [
            'Secure feet in the foot straps and grip the handle with a relaxed overhand grip.',
            'Sit tall with a slight forward lean and arms extended.',
        ],
        'lifting': [
            'Drive through the legs first, then lean the torso back slightly, then pull the handle to the lower ribs.',
            'Sequence is legs, body, arms in that order.',
        ],
        'lowering': [
            'Extend the arms first, then hinge the torso forward, then bend the knees to slide back.',
            'The return sequence is arms, body, legs.',
        ],
        'completion': [
            'Maintain a consistent rhythm and avoid jerking; rowing is a technical full-body exercise.',
        ],
    },
    'clean and press': {
        'muscle_groups': ['Full Body', 'Shoulders', 'Legs', 'Back'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'advanced',
        'setup': [
            'Set up as for a deadlift with the bar over mid-foot; grip just outside the hips.',
            'Set the back and brace the core before the first pull.',
        ],
        'lifting': [
            'Pull the bar explosively from the floor, extend the hips and shrug, then drop under the bar to catch it on the front delts.',
            'From the front-rack position, press the bar overhead to full lockout.',
        ],
        'lowering': [
            'Lower the bar from overhead to the front rack, then to the hips, then to the floor with control.',
            'Maintain tension throughout the entire descent.',
        ],
        'completion': [
            'This is a technically complex lift; master the clean and press separately before combining them.',
        ],
    },
    'thruster': {
        'muscle_groups': ['Quads', 'Glutes', 'Shoulders', 'Triceps', 'Core'],
        'equipment': 'Barbell',
        'category': 'Strength',
        'difficulty': 'advanced',
        'setup': [
            'Hold the bar in the front rack position with elbows high; feet shoulder-width.',
            'Keep elbows up throughout the entire movement.',
        ],
        'lifting': [
            'Use the momentum from the squat to drive the bar overhead in one fluid motion.',
            'Lock out the arms fully overhead before lowering.',
        ],
        'lowering': [
            'Lower the bar back to the front rack and descend directly into the next squat.',
            'Keep elbows high during the entire descent.',
        ],
        'completion': [
            'The thruster demands significant coordination; practice the front squat and push-press separately first.',
        ],
    },
    'turkish get-up': {
        'muscle_groups': ['Full Body', 'Shoulders', 'Core', 'Hips'],
        'equipment': 'Kettlebell',
        'category': 'Strength',
        'difficulty': 'advanced',
        'setup': [
            'Lie on your back holding a kettlebell in one hand, arm extended toward the ceiling.',
            'The same-side knee is bent with the foot flat on the floor.',
        ],
        'lifting': [
            'Follow the six-phase get-up sequence: roll to elbow, press to hand, bridge, sweep leg, windmill up, stand.',
            'Keep the kettlebell arm locked out and vertical at every stage.',
        ],
        'lowering': [
            'Reverse all six phases with equal control to return to the lying position.',
            'Move slowly and deliberately; this is a movement practice, not a speed drill.',
        ],
        'completion': [
            'Complete all reps on one side before switching; learn the movement with a shoe balanced on the fist first.',
        ],
    },
    'box jump': {
        'muscle_groups': ['Quads', 'Glutes', 'Calves', 'Core'],
        'equipment': 'Plyo Box',
        'category': 'Cardio',
        'difficulty': 'intermediate',
        'setup': [
            'Stand facing a sturdy plyo box, feet hip-width apart.',
            'Swing the arms back and load into a quarter squat.',
        ],
        'lifting': [
            'Swing the arms forward and explode upward, driving the knees up to clear the box.',
            'Land softly with bent knees in the center of the box.',
        ],
        'lowering': [
            'Step down from the box one foot at a time rather than jumping down.',
            'Reset the starting position before each jump.',
        ],
        'completion': [
            'Step down is safer than jumping down for high-volume sets; prioritize soft landings.',
        ],
    },
    'battle ropes': {
        'muscle_groups': ['Shoulders', 'Core', 'Arms', 'Cardio'],
        'equipment': 'Battle Ropes',
        'category': 'Cardio',
        'difficulty': 'intermediate',
        'setup': [
            'Hold one rope end in each hand; stand with feet shoulder-width and hips back in an athletic stance.',
            'Keep the core braced and a slight bend in the knees.',
        ],
        'lifting': [
            'Raise one arm forcefully to create a wave, then immediately lower and raise the other arm.',
            'Maintain continuous alternating waves or choose a double-wave pattern.',
        ],
        'lowering': [
            'Control the descent of each arm without going limp; maintain tension on the rope.',
            'Keep the wave consistent in amplitude throughout the set.',
        ],
        'completion': [
            'Work in intervals; battle ropes are highly demanding on the cardiovascular system.',
        ],
    },
    'sled push': {
        'muscle_groups': ['Quads', 'Glutes', 'Hamstrings', 'Core', 'Shoulders'],
        'equipment': 'Sled',
        'category': 'Cardio',
        'difficulty': 'intermediate',
        'setup': [
            'Load the sled and grip the uprights with arms extended or bent.',
            'Lean into the sled at about 45 degrees with a flat back.',
        ],
        'lifting': [
            'Drive powerfully through the legs in short, fast strides to push the sled forward.',
            'Maintain a consistent lean angle and keep the core braced.',
        ],
        'lowering': [
            'There is no eccentric phase; this is a concentric-only exercise.',
            'Maintain effort throughout the full length of the push.',
        ],
        'completion': [
            'Reset by pulling the sled back, which adds a pulling stimulus; load appropriately for target distance.',
        ],
    },
    'medicine ball slam': {
        'muscle_groups': ['Core', 'Shoulders', 'Lats', 'Glutes'],
        'equipment': 'Medicine Ball',
        'category': 'Cardio',
        'difficulty': 'beginner',
        'setup': [
            'Stand with feet shoulder-width holding a heavy medicine ball at waist height.',
            'Engage the core and prepare for a full-body explosive movement.',
        ],
        'lifting': [
            'Raise the ball overhead with arms fully extended, rising onto the toes.',
            'Immediately slam the ball down with maximum force.',
        ],
        'lowering': [
            'There is no slow lowering phase; the slam itself is the movement.',
            'Catch the ball if it bounces, or pick it up from the floor.',
        ],
        'completion': [
            'Use a dead ball (non-bouncing) for safety and to focus on power output.',
        ],
    },
}


# ---------------------------------------------------------------------------
# Flask routes
# ---------------------------------------------------------------------------

@exercise_library_bp.route('/exercise-library/search', methods=['GET'])
@login_required
def search_exercise_library():
    """Search the exercise library for instructions and tips."""
    try:
        query = request.args.get('q', '').lower().strip()

        if not query:
            return jsonify({
                'success': False,
                'message': 'Search query required'
            }), 400

        results = []
        for exercise_name, details in EXERCISE_LIBRARY.items():
            if query in exercise_name.lower():
                results.append({
                    'name': exercise_name.title(),
                    'muscle_groups': details['muscle_groups'],
                    'equipment': details['equipment'],
                    'category': details.get('category', ''),
                    'difficulty': details['difficulty'],
                    'setup': details['setup'],
                    'lifting': details['lifting'],
                    'lowering': details['lowering'],
                    'completion': details['completion'],
                })

        return jsonify({
            'success': True,
            'results': results,
            'count': len(results)
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error searching exercise library: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to search exercise library'
        }), 500


@exercise_library_bp.route('/exercise-library/all', methods=['GET'])
@login_required
def get_all_exercises():
    """Get all exercises in the library."""
    try:
        exercises = []
        for exercise_name, details in EXERCISE_LIBRARY.items():
            exercises.append({
                'name': exercise_name.title(),
                'muscle_groups': details['muscle_groups'],
                'equipment': details['equipment'],
                'category': details.get('category', ''),
                'difficulty': details['difficulty'],
                'setup': details['setup'],
                'lifting': details['lifting'],
                'lowering': details['lowering'],
                'completion': details['completion'],
            })

        return jsonify({
            'success': True,
            'exercises': exercises,
            'count': len(exercises)
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching exercise library: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch exercise library'
        }), 500


@exercise_library_bp.route('/exercise-library/<exercise_name>', methods=['GET'])
@login_required
def get_exercise_details(exercise_name):
    """Get detailed information about a specific exercise."""
    try:
        exercise_key = exercise_name.lower().strip()

        if exercise_key not in EXERCISE_LIBRARY:
            return jsonify({
                'success': False,
                'message': 'Exercise not found in library'
            }), 404

        details = EXERCISE_LIBRARY[exercise_key]

        return jsonify({
            'success': True,
            'exercise': {
                'name': exercise_name.title(),
                'muscle_groups': details['muscle_groups'],
                'equipment': details['equipment'],
                'category': details.get('category', ''),
                'difficulty': details['difficulty'],
                'setup': details['setup'],
                'lifting': details['lifting'],
                'lowering': details['lowering'],
                'completion': details['completion'],
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching exercise details: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch exercise details'
        }), 500
