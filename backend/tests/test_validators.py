"""
test_validators.py - Tests for backend/utils/validators.py

Every Marshmallow schema defined in validators.py is exercised here:
  - WorkoutSchema
  - ExerciseSchema
  - HabitSchema
  - HabitLogSchema
  - GoalSchema
  - GoalLinkSchema
  - WeightLogSchema
  - UserProfileSchema
  - PaginationSchema
  - DateRangeSchema
  - validate_request decorator
  - validate_query_params decorator

Strategy: pure unit tests — no DB, no HTTP client required.  Each schema is
instantiated directly and Schema.load() is called so we can inspect errors
without the overhead of an HTTP round-trip.  The decorator tests use the Flask
test client to verify integration at the HTTP boundary.
"""

import datetime
import pytest
from marshmallow import ValidationError

from utils.validators import (
    WorkoutSchema,
    ExerciseSchema,
    HabitSchema,
    HabitLogSchema,
    GoalSchema,
    GoalLinkSchema,
    WeightLogSchema,
    UserProfileSchema,
    PaginationSchema,
    DateRangeSchema,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_ok(schema_cls, data: dict):
    """Assert that schema.load() succeeds and return the result."""
    result = schema_cls().load(data)
    assert result is not None
    return result


def load_fails(schema_cls, data: dict) -> dict:
    """Assert that schema.load() raises ValidationError and return errors."""
    with pytest.raises(ValidationError) as exc_info:
        schema_cls().load(data)
    return exc_info.value.messages


# ---------------------------------------------------------------------------
# WorkoutSchema
# ---------------------------------------------------------------------------

class TestWorkoutSchema:
    """Tests for WorkoutSchema (workout creation validation)."""

    def _valid(self, **overrides):
        base = {
            "type": "Strength",
            "duration": 60,
            "date": "2025-06-01",
        }
        base.update(overrides)
        return base

    def test_valid_minimal_payload_passes(self):
        result = load_ok(WorkoutSchema, self._valid())
        assert result["type"] == "Strength"
        assert result["duration"] == 60

    def test_valid_payload_with_all_optional_fields(self):
        data = self._valid(notes="Felt great", rpe=7, exercises=[])
        result = load_ok(WorkoutSchema, data)
        assert result["rpe"] == 7
        assert result["notes"] == "Felt great"

    def test_missing_type_fails(self):
        errors = load_fails(WorkoutSchema, {"duration": 60, "date": "2025-06-01"})
        assert "type" in errors

    def test_missing_duration_fails(self):
        errors = load_fails(WorkoutSchema, {"type": "Cardio", "date": "2025-06-01"})
        assert "duration" in errors

    def test_missing_date_fails(self):
        errors = load_fails(WorkoutSchema, {"type": "Cardio", "duration": 45})
        assert "date" in errors

    def test_duration_below_minimum_fails(self):
        """Duration must be at least 1 minute."""
        errors = load_fails(WorkoutSchema, self._valid(duration=0))
        assert "duration" in errors

    def test_duration_above_maximum_fails(self):
        """Duration cannot exceed 1440 minutes (24 hours)."""
        errors = load_fails(WorkoutSchema, self._valid(duration=1441))
        assert "duration" in errors

    def test_duration_at_boundary_values_pass(self):
        load_ok(WorkoutSchema, self._valid(duration=1))
        load_ok(WorkoutSchema, self._valid(duration=1440))

    def test_rpe_below_minimum_fails(self):
        errors = load_fails(WorkoutSchema, self._valid(rpe=0))
        assert "rpe" in errors

    def test_rpe_above_maximum_fails(self):
        errors = load_fails(WorkoutSchema, self._valid(rpe=11))
        assert "rpe" in errors

    def test_rpe_at_boundary_values_pass(self):
        load_ok(WorkoutSchema, self._valid(rpe=1))
        load_ok(WorkoutSchema, self._valid(rpe=10))

    def test_rpe_none_is_allowed(self):
        load_ok(WorkoutSchema, self._valid(rpe=None))

    def test_notes_none_is_allowed(self):
        load_ok(WorkoutSchema, self._valid(notes=None))

    def test_notes_exceeding_max_length_fails(self):
        long_notes = "x" * 501
        errors = load_fails(WorkoutSchema, self._valid(notes=long_notes))
        assert "notes" in errors

    def test_type_empty_string_fails(self):
        errors = load_fails(WorkoutSchema, self._valid(type=""))
        assert "type" in errors

    def test_type_at_max_length_passes(self):
        load_ok(WorkoutSchema, self._valid(type="A" * 100))

    def test_type_exceeding_max_length_fails(self):
        errors = load_fails(WorkoutSchema, self._valid(type="A" * 101))
        assert "type" in errors

    def test_unknown_fields_are_excluded_not_raised(self):
        """Meta.unknown = EXCLUDE means extra keys are silently dropped."""
        result = load_ok(WorkoutSchema, self._valid(unknown_field="ignored"))
        assert "unknown_field" not in result

    def test_exercises_is_optional(self):
        """exercises field is not required — omitting it is valid."""
        data = {"type": "Yoga", "duration": 45, "date": "2025-06-01"}
        result = load_ok(WorkoutSchema, data)
        assert "exercises" not in result or result.get("exercises") is None


# ---------------------------------------------------------------------------
# ExerciseSchema
# ---------------------------------------------------------------------------

class TestExerciseSchema:
    """Tests for ExerciseSchema (exercise entry in a workout)."""

    def _valid(self, **overrides):
        base = {"name": "Bench Press"}
        base.update(overrides)
        return base

    def test_valid_minimal_payload_passes(self):
        result = load_ok(ExerciseSchema, self._valid())
        assert result["name"] == "Bench Press"

    def test_missing_name_fails(self):
        errors = load_fails(ExerciseSchema, {"sets": 3, "reps": 10})
        assert "name" in errors

    def test_name_empty_string_fails(self):
        errors = load_fails(ExerciseSchema, self._valid(name=""))
        assert "name" in errors

    def test_sets_below_zero_fails(self):
        errors = load_fails(ExerciseSchema, self._valid(sets=-1))
        assert "sets" in errors

    def test_sets_at_maximum_boundary_passes(self):
        load_ok(ExerciseSchema, self._valid(sets=100))

    def test_sets_above_maximum_fails(self):
        errors = load_fails(ExerciseSchema, self._valid(sets=101))
        assert "sets" in errors

    def test_reps_above_maximum_fails(self):
        errors = load_fails(ExerciseSchema, self._valid(reps=1001))
        assert "reps" in errors

    def test_weight_below_zero_fails(self):
        errors = load_fails(ExerciseSchema, self._valid(weight=-0.1))
        assert "weight" in errors

    def test_weight_at_maximum_boundary_passes(self):
        load_ok(ExerciseSchema, self._valid(weight=1000.0))

    def test_weight_above_maximum_fails(self):
        errors = load_fails(ExerciseSchema, self._valid(weight=1000.1))
        assert "weight" in errors

    def test_all_optional_fields_none_passes(self):
        result = load_ok(
            ExerciseSchema,
            {"name": "Squat", "sets": None, "reps": None, "weight": None,
             "duration": None, "notes": None}
        )
        assert result["name"] == "Squat"

    def test_notes_exceeding_max_length_fails(self):
        errors = load_fails(ExerciseSchema, self._valid(notes="x" * 501))
        assert "notes" in errors


# ---------------------------------------------------------------------------
# HabitSchema
# ---------------------------------------------------------------------------

class TestHabitSchema:
    """Tests for HabitSchema (habit creation)."""

    def _valid(self, **overrides):
        base = {
            "name": "Morning Run",
            "frequency": "daily",
            "reminder_time": "07:00",
            "description": "Run 5km every morning",
            "next_occurrence": "2025-06-01",
        }
        base.update(overrides)
        return base

    def test_valid_payload_passes(self):
        result = load_ok(HabitSchema, self._valid())
        assert result["name"] == "Morning Run"

    def test_missing_name_fails(self):
        data = self._valid()
        del data["name"]
        errors = load_fails(HabitSchema, data)
        assert "name" in errors

    def test_invalid_frequency_fails(self):
        errors = load_fails(HabitSchema, self._valid(frequency="hourly"))
        assert "frequency" in errors

    def test_all_valid_frequencies_accepted(self):
        for freq in ("daily", "weekly", "monthly"):
            load_ok(HabitSchema, self._valid(frequency=freq))

    def test_missing_reminder_time_fails(self):
        data = self._valid()
        del data["reminder_time"]
        errors = load_fails(HabitSchema, data)
        assert "reminder_time" in errors

    def test_name_empty_string_fails(self):
        errors = load_fails(HabitSchema, self._valid(name=""))
        assert "name" in errors

    def test_name_at_max_length_passes(self):
        load_ok(HabitSchema, self._valid(name="A" * 200))

    def test_name_exceeding_max_length_fails(self):
        errors = load_fails(HabitSchema, self._valid(name="A" * 201))
        assert "name" in errors

    def test_description_required(self):
        data = self._valid()
        del data["description"]
        errors = load_fails(HabitSchema, data)
        assert "description" in errors

    def test_description_empty_string_fails(self):
        errors = load_fails(HabitSchema, self._valid(description=""))
        assert "description" in errors


# ---------------------------------------------------------------------------
# HabitLogSchema
# ---------------------------------------------------------------------------

class TestHabitLogSchema:
    """Tests for HabitLogSchema (logging a habit completion)."""

    def test_valid_completed_true_passes(self):
        result = load_ok(HabitLogSchema, {"completed": True})
        assert result["completed"] is True

    def test_valid_completed_false_passes(self):
        result = load_ok(HabitLogSchema, {"completed": False})
        assert result["completed"] is False

    def test_missing_completed_fails(self):
        errors = load_fails(HabitLogSchema, {})
        assert "completed" in errors

    def test_amount_below_zero_fails(self):
        errors = load_fails(HabitLogSchema, {"completed": True, "amount": -1.0})
        assert "amount" in errors

    def test_amount_zero_passes(self):
        load_ok(HabitLogSchema, {"completed": True, "amount": 0.0})

    def test_notes_none_allowed(self):
        load_ok(HabitLogSchema, {"completed": True, "notes": None})

    def test_notes_exceeding_max_fails(self):
        errors = load_fails(HabitLogSchema, {"completed": True, "notes": "x" * 501})
        assert "notes" in errors

    def test_optional_timestamp_accepted(self):
        load_ok(HabitLogSchema, {"completed": True, "timestamp": "2025-06-01T10:00:00"})

    def test_timestamp_none_allowed(self):
        load_ok(HabitLogSchema, {"completed": True, "timestamp": None})


# ---------------------------------------------------------------------------
# GoalSchema
# ---------------------------------------------------------------------------

class TestGoalSchema:
    """Tests for GoalSchema (goal creation / update)."""

    def _valid(self, **overrides):
        base = {"title": "Run a 5K", "target": 5.0}
        base.update(overrides)
        return base

    def test_valid_minimal_payload_passes(self):
        result = load_ok(GoalSchema, self._valid())
        assert result["title"] == "Run a 5K"
        assert result["target"] == 5.0

    def test_missing_title_fails(self):
        errors = load_fails(GoalSchema, {"target": 10.0})
        assert "title" in errors

    def test_missing_target_fails(self):
        errors = load_fails(GoalSchema, {"title": "Lift heavy"})
        assert "target" in errors

    def test_title_empty_string_fails(self):
        errors = load_fails(GoalSchema, self._valid(title=""))
        assert "title" in errors

    def test_title_at_max_length_passes(self):
        load_ok(GoalSchema, self._valid(title="A" * 200))

    def test_title_exceeding_max_length_fails(self):
        errors = load_fails(GoalSchema, self._valid(title="A" * 201))
        assert "title" in errors

    def test_target_below_zero_fails(self):
        errors = load_fails(GoalSchema, self._valid(target=-1.0))
        assert "target" in errors

    def test_target_zero_passes(self):
        load_ok(GoalSchema, self._valid(target=0.0))

    def test_optional_deadline_accepted(self):
        load_ok(GoalSchema, self._valid(deadline="2025-12-31"))

    def test_optional_deadline_none_passes(self):
        load_ok(GoalSchema, self._valid(deadline=None))

    def test_optional_description_none_passes(self):
        load_ok(GoalSchema, self._valid(description=None))

    def test_description_exceeding_max_length_fails(self):
        errors = load_fails(GoalSchema, self._valid(description="x" * 1001))
        assert "description" in errors

    def test_category_exceeding_max_length_fails(self):
        errors = load_fails(GoalSchema, self._valid(category="x" * 51))
        assert "category" in errors

    def test_progress_is_optional(self):
        load_ok(GoalSchema, self._valid(progress=2.5))

    def test_progress_below_zero_fails(self):
        errors = load_fails(GoalSchema, self._valid(progress=-0.1))
        assert "progress" in errors


# ---------------------------------------------------------------------------
# GoalLinkSchema
# ---------------------------------------------------------------------------

class TestGoalLinkSchema:
    """Tests for GoalLinkSchema including cross-field validation."""

    def _valid_workout(self, **overrides):
        base = {
            "entity_type": "workout",
            "entity_id": None,
            "contribution_value": 1.0,
        }
        base.update(overrides)
        return base

    def _valid_habit(self, **overrides):
        base = {
            "entity_type": "habit",
            "entity_id": 42,
            "contribution_value": 1.0,
        }
        base.update(overrides)
        return base

    def test_valid_workout_link_without_entity_id_passes(self):
        result = load_ok(GoalLinkSchema, self._valid_workout())
        assert result["entity_type"] == "workout"

    def test_valid_habit_link_with_entity_id_passes(self):
        result = load_ok(GoalLinkSchema, self._valid_habit())
        assert result["entity_id"] == 42

    def test_invalid_entity_type_fails(self):
        errors = load_fails(GoalLinkSchema, self._valid_workout(entity_type="goal"))
        assert "entity_type" in errors

    def test_habit_link_without_entity_id_fails(self):
        """Cross-field rule: habit entity_type requires entity_id."""
        errors = load_fails(GoalLinkSchema, self._valid_habit(entity_id=None))
        # The custom @validates_schema raises on _schema key
        assert "_schema" in errors or "entity_id" in errors

    def test_missing_entity_type_fails(self):
        errors = load_fails(GoalLinkSchema, {"contribution_value": 1.0})
        assert "entity_type" in errors

    def test_missing_contribution_value_fails(self):
        errors = load_fails(GoalLinkSchema, self._valid_workout(contribution_value=None))
        # contribution_value is required; None should fail type coercion
        assert "contribution_value" in errors

    def test_contribution_value_below_zero_fails(self):
        errors = load_fails(GoalLinkSchema, self._valid_workout(contribution_value=-0.5))
        assert "contribution_value" in errors

    def test_entity_id_below_minimum_fails(self):
        errors = load_fails(GoalLinkSchema, self._valid_habit(entity_id=0))
        assert "entity_id" in errors


# ---------------------------------------------------------------------------
# WeightLogSchema
# ---------------------------------------------------------------------------

class TestWeightLogSchema:
    """Tests for WeightLogSchema (weight logging)."""

    def _valid(self, **overrides):
        base = {"weight_kg": 75.0, "date": "2025-06-01"}
        base.update(overrides)
        return base

    def test_valid_payload_passes(self):
        result = load_ok(WeightLogSchema, self._valid())
        assert result["weight_kg"] == 75.0

    def test_missing_weight_fails(self):
        errors = load_fails(WeightLogSchema, {"date": "2025-06-01"})
        assert "weight_kg" in errors

    def test_missing_date_fails(self):
        errors = load_fails(WeightLogSchema, {"weight_kg": 75.0})
        assert "date" in errors

    def test_weight_below_minimum_fails(self):
        """Minimum allowed weight is 20 kg."""
        errors = load_fails(WeightLogSchema, self._valid(weight_kg=19.9))
        assert "weight_kg" in errors

    def test_weight_at_minimum_boundary_passes(self):
        load_ok(WeightLogSchema, self._valid(weight_kg=20.0))

    def test_weight_above_maximum_fails(self):
        """Maximum allowed weight is 500 kg."""
        errors = load_fails(WeightLogSchema, self._valid(weight_kg=500.1))
        assert "weight_kg" in errors

    def test_weight_at_maximum_boundary_passes(self):
        load_ok(WeightLogSchema, self._valid(weight_kg=500.0))


# ---------------------------------------------------------------------------
# UserProfileSchema
# ---------------------------------------------------------------------------

class TestUserProfileSchema:
    """Tests for UserProfileSchema (profile updates)."""

    def _valid(self, **overrides):
        base = {
            "age": 30,
            "gender": "male",
            "height_cm": 175.0,
            "current_weight_kg": 75.0,
            "goal_weight_kg": 70.0,
            "activity_level": "moderately_active",
        }
        base.update(overrides)
        return base

    def test_valid_full_profile_passes(self):
        result = load_ok(UserProfileSchema, self._valid())
        assert result["age"] == 30
        assert result["gender"] == "male"

    def test_all_fields_optional_empty_dict_passes(self):
        load_ok(UserProfileSchema, {})

    def test_age_below_minimum_fails(self):
        errors = load_fails(UserProfileSchema, self._valid(age=12))
        assert "age" in errors

    def test_age_at_minimum_boundary_passes(self):
        load_ok(UserProfileSchema, self._valid(age=13))

    def test_age_above_maximum_fails(self):
        errors = load_fails(UserProfileSchema, self._valid(age=121))
        assert "age" in errors

    def test_gender_invalid_value_fails(self):
        errors = load_fails(UserProfileSchema, self._valid(gender="unknown"))
        assert "gender" in errors

    def test_gender_all_valid_values_pass(self):
        for gender in ("male", "female", "other"):
            load_ok(UserProfileSchema, self._valid(gender=gender))

    def test_height_below_minimum_fails(self):
        errors = load_fails(UserProfileSchema, self._valid(height_cm=49.9))
        assert "height_cm" in errors

    def test_height_above_maximum_fails(self):
        errors = load_fails(UserProfileSchema, self._valid(height_cm=300.1))
        assert "height_cm" in errors

    def test_activity_level_invalid_fails(self):
        errors = load_fails(UserProfileSchema, self._valid(activity_level="super_active"))
        assert "activity_level" in errors

    def test_all_valid_activity_levels_pass(self):
        for level in ("sedentary", "lightly_active", "moderately_active",
                      "very_active", "extra_active"):
            load_ok(UserProfileSchema, self._valid(activity_level=level))

    def test_weight_fields_none_passes(self):
        load_ok(UserProfileSchema, self._valid(current_weight_kg=None, goal_weight_kg=None))


# ---------------------------------------------------------------------------
# PaginationSchema
# ---------------------------------------------------------------------------

class TestPaginationSchema:
    """Tests for PaginationSchema (query parameter validation)."""

    def test_defaults_applied_when_no_params_provided(self):
        result = load_ok(PaginationSchema, {})
        assert result["page"] == 1
        assert result["per_page"] == 10

    def test_valid_explicit_params_pass(self):
        result = load_ok(PaginationSchema, {"page": "3", "per_page": "25"})
        assert result["page"] == 3
        assert result["per_page"] == 25

    def test_page_below_minimum_fails(self):
        errors = load_fails(PaginationSchema, {"page": "0"})
        assert "page" in errors

    def test_per_page_above_maximum_fails(self):
        errors = load_fails(PaginationSchema, {"per_page": "101"})
        assert "per_page" in errors

    def test_per_page_at_maximum_boundary_passes(self):
        result = load_ok(PaginationSchema, {"per_page": "100"})
        assert result["per_page"] == 100

    def test_per_page_below_minimum_fails(self):
        errors = load_fails(PaginationSchema, {"per_page": "0"})
        assert "per_page" in errors


# ---------------------------------------------------------------------------
# DateRangeSchema
# ---------------------------------------------------------------------------

class TestDateRangeSchema:
    """Tests for DateRangeSchema including cross-field ordering validation."""

    def test_valid_date_range_passes(self):
        result = load_ok(DateRangeSchema, {
            "start_date": "2025-01-01",
            "end_date": "2025-06-30",
        })
        assert result["start_date"] < result["end_date"]

    def test_both_dates_optional(self):
        load_ok(DateRangeSchema, {})

    def test_only_start_date_passes(self):
        load_ok(DateRangeSchema, {"start_date": "2025-01-01"})

    def test_only_end_date_passes(self):
        load_ok(DateRangeSchema, {"end_date": "2025-12-31"})

    def test_start_date_after_end_date_fails(self):
        """Cross-field rule: start must be before end."""
        errors = load_fails(DateRangeSchema, {
            "start_date": "2025-12-31",
            "end_date": "2025-01-01",
        })
        assert "_schema" in errors

    def test_same_start_and_end_date_passes(self):
        """Same start and end date is allowed (validator uses > not >=)."""
        result = DateRangeSchema().load({
            "start_date": "2025-06-01",
            "end_date": "2025-06-01",
        })
        assert result["start_date"] == result["end_date"]

    def test_invalid_date_format_fails(self):
        errors = load_fails(DateRangeSchema, {
            "start_date": "01/06/2025",  # wrong format
            "end_date": "2025-12-31",
        })
        assert "start_date" in errors


# ---------------------------------------------------------------------------
# validate_request decorator — HTTP integration tests
# ---------------------------------------------------------------------------

class TestValidateRequestDecorator:
    """
    Drive the validate_request decorator through a real HTTP endpoint
    (POST /api/v1/workouts) so we test the full request pipeline.
    """

    def test_valid_payload_is_accepted_by_decorator(self, client, auth_headers):
        """A valid workout payload must pass through the decorator."""
        resp = client.post(
            "/api/v1/workouts",
            json={
                "type": "Strength",
                "duration": 45,
                "date": "2025-06-01",
            },
            headers={"Authorization": auth_headers["Authorization"]},
        )
        # 201 = decorator passed + route handled; anything in 400s means validation rejected it.
        assert resp.status_code == 201

    def test_invalid_payload_returns_400_with_validation_errors(self, client, auth_headers):
        """An invalid payload must be intercepted by the decorator with a 400."""
        resp = client.post(
            "/api/v1/workouts",
            json={
                # 'type' missing, duration out of range
                "duration": 9999,
                "date": "2025-06-01",
            },
            headers={"Authorization": auth_headers["Authorization"]},
        )
        assert resp.status_code == 400
        data = resp.get_json()
        assert data["success"] is False
        assert "errors" in data
        # At minimum, 'type' must be reported
        assert "type" in data["errors"] or "duration" in data["errors"]

    def test_empty_json_body_returns_400(self, client, auth_headers):
        """An empty JSON body must be rejected by the decorator."""
        resp = client.post(
            "/api/v1/workouts",
            json={},
            headers={"Authorization": auth_headers["Authorization"]},
        )
        assert resp.status_code == 400
        data = resp.get_json()
        assert data["success"] is False
        assert "errors" in data

    def test_validation_error_response_structure(self, client, auth_headers):
        """Error response must follow the standard {success, message, errors} contract."""
        resp = client.post(
            "/api/v1/workouts",
            json={"type": "Strength"},  # missing duration and date
            headers={"Authorization": auth_headers["Authorization"]},
        )
        assert resp.status_code == 400
        data = resp.get_json()
        assert "success" in data
        assert "message" in data
        assert "errors" in data
        assert data["message"] == "Validation error"
