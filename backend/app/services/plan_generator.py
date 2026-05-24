from ..models import FitnessAssessment
from .openai_planner import generate_ai_plan


def build_plan_response(
    assessment: FitnessAssessment, rank_result: dict, goal_result: dict
) -> dict:
    prompt = build_ai_prompt(assessment, rank_result, goal_result)
    ai_result = generate_ai_plan(prompt)

    return {
        "fitRank": rank_result,
        "goal": goal_result,
        "plan": ai_result["plan"] or {
            "workouts": [
                "Day 1: full-body strength and core",
                "Day 2: zone 2 cardio and mobility",
                "Day 3: lower-body strength",
                "Day 4: rest or light walk",
                "Day 5: upper-body strength and intervals",
                "Day 6: longer cardio session",
                "Day 7: recovery and stretching",
            ],
            "nutrition": {
                "focus": "high protein, whole foods, stable hydration",
                "macros": "adjust calories and macros after the first full profile review",
            },
        },
        "aiPrompt": prompt,
        "ai": {
            "provider": ai_result["provider"],
            "model": ai_result["model"],
            "generated": ai_result["generated"],
            "reason": ai_result["reason"],
        },
    }


def build_ai_prompt(
    assessment: FitnessAssessment, rank_result: dict, goal_result: dict
) -> str:
    biometrics = assessment.biometrics
    exercise = assessment.exercise_results

    return (
        "Create a safe weekly fitness and nutrition plan for a user with "
        f"FitRank score {rank_result['score']} ({rank_result['percentileLabel']}). "
        f"Age: {biometrics.age}, height: {biometrics.height_cm} cm, "
        f"weight: {biometrics.weight_kg} kg, activity: {biometrics.activity_level}. "
        f"Results: {exercise.pushups} pushups, {exercise.bench_kg} kg bench press, "
        f"{exercise.pullups} pullups, {exercise.squat_kg} kg squat, "
        f"{exercise.deadlift_kg} kg deadlift. "
        f"Goal: {goal_result['goal']}. Deadline: {goal_result['deadlineWeeks']} weeks. "
        f"Goal realism: {goal_result['realism']}. "
        "Return structured workouts, recovery guidance, calories, macros, and example meals."
    )
