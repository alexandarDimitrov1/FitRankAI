from flask import Blueprint, jsonify, request

from .models import Biometrics, ExerciseResults, FitnessAssessment
from .services.fitrank import calculate_fitrank, evaluate_goal
from .services.firebase_store import (
    get_firebase_status,
    load_user_profile,
    save_plan_snapshot,
    save_user_profile,
)
from .services.plan_generator import build_plan_response

api = Blueprint("api", __name__)


@api.get("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "service": "fitrank-api",
            "firebase": get_firebase_status(),
        }
    )


@api.post("/api/rank")
def rank():
    assessment = _parse_assessment(request.get_json(silent=True) or {})
    result = calculate_fitrank(assessment)
    return jsonify(result)


@api.post("/api/plan")
def plan():
    assessment = _parse_assessment(request.get_json(silent=True) or {})
    rank_result = calculate_fitrank(assessment)
    goal_result = evaluate_goal(assessment, rank_result["score"])
    plan_result = build_plan_response(assessment, rank_result, goal_result)
    plan_result["storage"] = save_plan_snapshot(
        user_id=request.headers.get("X-FitRank-User", "demo-user"),
        assessment=assessment,
        plan_result=plan_result,
    )
    return jsonify(plan_result)


@api.post("/api/profile")
def profile():
    payload = request.get_json(silent=True) or {}
    profile_payload = payload.get("profile", payload)
    user_id = request.headers.get("X-FitRank-User") or profile_payload.get("email")
    return jsonify(
        {
            "profile": profile_payload,
            "storage": save_user_profile(user_id or "demo-user", profile_payload),
        }
    )


@api.get("/api/profile/<user_id>")
def get_profile(user_id: str):
    return jsonify(load_user_profile(user_id))


def _parse_assessment(payload: dict) -> FitnessAssessment:
    biometrics = payload.get("biometrics", {})
    exercise_results = payload.get("exerciseResults", {})

    return FitnessAssessment(
        biometrics=Biometrics(
            age=int(biometrics.get("age", 18)),
            height_cm=float(biometrics.get("heightCm", 170)),
            weight_kg=float(biometrics.get("weightKg", 70)),
            activity_level=str(biometrics.get("activityLevel", "moderate")),
        ),
        exercise_results=ExerciseResults(
            pushups=int(exercise_results.get("pushups", 0)),
            bench_kg=float(exercise_results.get("benchKg", 0)),
            pullups=int(exercise_results.get("pullups", 0)),
            squat_kg=float(exercise_results.get("squatKg", 0)),
            deadlift_kg=float(exercise_results.get("deadliftKg", 0)),
        ),
        goal=payload.get("goal"),
        deadline_weeks=(
            int(payload["deadlineWeeks"]) if payload.get("deadlineWeeks") else None
        ),
    )
