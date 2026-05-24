from flask import Blueprint, jsonify, request

from .models import Biometrics, ExerciseResults, FitnessAssessment
from .services.fitrank import calculate_fitrank, evaluate_goal
from .services.plan_generator import build_plan_response

api = Blueprint("api", __name__)


@api.get("/health")
def health():
    return jsonify({"status": "ok", "service": "fitrank-api"})


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
    return jsonify(plan_result)


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
            squats=int(exercise_results.get("squats", 0)),
            plank_seconds=int(exercise_results.get("plankSeconds", 0)),
            run_minutes=float(exercise_results.get("runMinutes", 15)),
        ),
        goal=payload.get("goal"),
        deadline_weeks=(
            int(payload["deadlineWeeks"]) if payload.get("deadlineWeeks") else None
        ),
    )
