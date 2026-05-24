from ..models import FitnessAssessment


ACTIVITY_MULTIPLIERS = {
    "low": 0.9,
    "moderate": 1.0,
    "high": 1.08,
    "athlete": 1.15,
}


def calculate_fitrank(assessment: FitnessAssessment) -> dict:
    exercise = assessment.exercise_results
    biometrics = assessment.biometrics

    strength = min(100, exercise.pushups * 1.8 + exercise.squats * 1.1)
    endurance = min(100, exercise.plank_seconds / 2.4)
    cardio = max(0, min(100, 120 - exercise.run_minutes * 6))
    age_adjustment = 1.0 if biometrics.age <= 30 else max(0.82, 1 - (biometrics.age - 30) * 0.006)
    activity_multiplier = ACTIVITY_MULTIPLIERS.get(biometrics.activity_level.lower(), 1.0)

    raw_score = (strength * 0.4 + endurance * 0.25 + cardio * 0.35)
    score = round(max(0, min(100, raw_score * age_adjustment * activity_multiplier)))

    return {
        "score": score,
        "percentileLabel": _percentile_label(score),
        "breakdown": {
            "strength": round(strength),
            "endurance": round(endurance),
            "cardio": round(cardio),
        },
    }


def evaluate_goal(assessment: FitnessAssessment, score: int) -> dict:
    deadline = assessment.deadline_weeks or 8
    goal = (assessment.goal or "Improve overall fitness").strip()

    if deadline < 4 and score < 70:
        realism = "aggressive"
    elif deadline >= 8 or score >= 75:
        realism = "realistic"
    else:
        realism = "challenging"

    return {
        "goal": goal,
        "deadlineWeeks": deadline,
        "realism": realism,
        "message": _goal_message(realism),
    }


def _percentile_label(score: int) -> str:
    if score >= 85:
        return "Top 15%"
    if score >= 70:
        return "Top 35%"
    if score >= 50:
        return "Average"
    return "Beginner"


def _goal_message(realism: str) -> str:
    messages = {
        "realistic": "The deadline looks achievable with consistent training.",
        "challenging": "The goal is possible, but the plan should ramp gradually.",
        "aggressive": "The deadline is tight and should be adjusted or split into milestones.",
    }
    return messages[realism]
