from ..models import ExerciseResults, FitnessAssessment


ACTIVITY_MULTIPLIERS = {
    "low": 0.9,
    "moderate": 1.0,
    "high": 1.08,
    "athlete": 1.15,
}


def calculate_fitrank(assessment: FitnessAssessment) -> dict:
    exercise = assessment.exercise_results
    biometrics = assessment.biometrics
    bodyweight = max(biometrics.weight_kg, 1)
    score_parts = _calculate_score_parts(exercise, bodyweight)
    age_adjustment = (
        1.0
        if biometrics.age <= 30
        else max(0.82, 1 - (biometrics.age - 30) * 0.006)
    )
    activity_multiplier = ACTIVITY_MULTIPLIERS.get(
        biometrics.activity_level.lower(), 1.0
    )
    score = round(
        max(
            0,
            min(
                100,
                score_parts["raw_score"] * age_adjustment * activity_multiplier,
            ),
        )
    )

    return {
        "score": score,
        "percentileLabel": _percentile_label(score),
        "breakdown": {
            "upperBody": round(score_parts["upper_body"]),
            "lowerBody": round(score_parts["lower_body"]),
            "bodyweight": round(bodyweight),
        },
    }


def evaluate_goal(assessment: FitnessAssessment, score: int) -> dict:
    deadline = max(1, assessment.deadline_weeks or 8)
    goal = (assessment.goal or "Improve overall fitness").strip()
    target_score = _calculate_target_score(assessment, score)
    score_gap = max(0, target_score - score)
    weekly_gain_needed = score_gap / deadline

    if (target_score >= 92 and deadline < 10) or weekly_gain_needed > 5:
        realism = "unrealistic"
    elif weekly_gain_needed > 3 or deadline <= 4:
        realism = "intensive"
    elif weekly_gain_needed > 1.8:
        realism = "challenging"
    else:
        realism = "realistic"

    return {
        "goal": goal,
        "deadlineWeeks": deadline,
        "realism": realism,
        "message": _goal_message(realism),
        "targetScore": target_score,
        "scoreGap": round(score_gap),
        "weeklyGainNeeded": round(weekly_gain_needed, 1),
        "trainingDays": _training_days(realism),
        "nutritionIntensity": _nutrition_intensity(realism),
    }


def _calculate_target_score(assessment: FitnessAssessment, current_score: int) -> int:
    if not assessment.goal_targets:
        return min(100, current_score + 10)

    bodyweight = max(assessment.biometrics.weight_kg, 1)
    score_parts = _calculate_score_parts(assessment.goal_targets, bodyweight)
    return round(max(0, min(100, score_parts["raw_score"])))


def _calculate_score_parts(exercise: ExerciseResults, bodyweight: float) -> dict:
    upper_body = min(
        100,
        exercise.pushups * 1.2
        + exercise.pullups * 5
        + (exercise.bench_kg / bodyweight) * 30,
    )
    lower_body = min(
        100,
        (exercise.squat_kg / bodyweight) * 35
        + (exercise.deadlift_kg / bodyweight) * 40,
    )

    return {
        "upper_body": upper_body,
        "lower_body": lower_body,
        "raw_score": upper_body * 0.55 + lower_body * 0.45,
    }


def _percentile_label(score: int) -> str:
    if score >= 85:
        return "Top 15%"
    if score >= 70:
        return "Top 35%"
    if score >= 50:
        return "Average"
    return "Beginner"


def _training_days(realism: str) -> int:
    days = {
        "realistic": 4,
        "challenging": 5,
        "intensive": 6,
        "unrealistic": 4,
    }
    return days[realism]


def _nutrition_intensity(realism: str) -> str:
    intensities = {
        "realistic": "steady",
        "challenging": "high_protein",
        "intensive": "high_calorie_support",
        "unrealistic": "safer_milestone",
    }
    return intensities[realism]


def _goal_message(realism: str) -> str:
    messages = {
        "realistic": "Целта изглежда постижима с постоянни тренировки и нормално възстановяване.",
        "challenging": "Целта е възможна, но ще трябва да тренираш по-редовно и да следиш храненето.",
        "intensive": "Целта е реалистична само с по-чести тренировки, повече храна и добър сън.",
        "unrealistic": "Целта е прекалено голяма за този срок. Удължи периода или избери междинна цел.",
    }
    return messages[realism]
