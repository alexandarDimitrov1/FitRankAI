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
        "plan": ai_result["plan"] or _fallback_plan(goal_result),
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
    targets = assessment.goal_targets
    target_text = (
        f"Target results: {targets.pushups} pushups, {targets.bench_kg} kg bench press, "
        f"{targets.pullups} pullups, {targets.squat_kg} kg squat, "
        f"{targets.deadlift_kg} kg deadlift. "
        if targets
        else "Target results: improve overall strength. "
    )

    return (
        "Create a safe weekly fitness and nutrition plan for a user with "
        f"FitRank score {rank_result['score']} ({rank_result['percentileLabel']}). "
        f"Age: {biometrics.age}, height: {biometrics.height_cm} cm, "
        f"weight: {biometrics.weight_kg} kg, activity: {biometrics.activity_level}. "
        f"Current results: {exercise.pushups} pushups, {exercise.bench_kg} kg bench press, "
        f"{exercise.pullups} pullups, {exercise.squat_kg} kg squat, "
        f"{exercise.deadlift_kg} kg deadlift. "
        f"{target_text}"
        f"Goal: {goal_result['goal']}. Deadline: {goal_result['deadlineWeeks']} weeks. "
        f"Goal realism: {goal_result['realism']}. "
        f"Training days recommendation: {goal_result['trainingDays']} days weekly. "
        "If the goal is unrealistic, explain the risk and propose a safer milestone. "
        "If the goal is intensive, increase training frequency, food intake, recovery, and monitoring. "
        "Return structured workouts, recovery guidance, calories, macros, and example meals."
    )


def _fallback_plan(goal_result: dict) -> dict:
    realism = goal_result["realism"]

    workouts_by_realism = {
        "realistic": [
            "Ден 1: лежанка, лицеви опори и набирания",
            "Ден 2: клек, корем и мобилност",
            "Ден 3: почивка или леко кардио",
            "Ден 4: мъртва тяга, гръб и набирания",
            "Ден 5: техника и умерен обем",
        ],
        "challenging": [
            "Ден 1: тежка лежанка и набирания",
            "Ден 2: клек, крака и корем",
            "Ден 3: възстановяване и мобилност",
            "Ден 4: мъртва тяга и гръб",
            "Ден 5: обем за слабите упражнения",
            "Ден 6: леко кардио и разтягане",
        ],
        "intensive": [
            "Ден 1: лежанка плюс допълнителни лицеви опори",
            "Ден 2: клек и техника",
            "Ден 3: набирания, гръб и корем",
            "Ден 4: мъртва тяга и задно бедро",
            "Ден 5: повторение на най-слабите упражнения",
            "Ден 6: лек обем, мобилност и възстановяване",
            "Ден 7: пълна почивка",
        ],
        "unrealistic": [
            "Седмица 1: намали целта до междинен етап и тествай техника",
            "Ден 1: лежанка и лицеви опори с умерена тежест",
            "Ден 2: клек и мобилност",
            "Ден 4: мъртва тяга и набирания",
            "Ден 6: техника, разтягане и активна почивка",
        ],
    }

    nutrition_by_realism = {
        "realistic": {
            "focus": "Стабилен протеин, нормални порции и постоянство.",
            "macros": "Около 1.6-2.0 г протеин на кг телесно тегло.",
            "meals": "Яйца или кисело мляко, месо/риба с ориз или картофи, плодове и вода.",
        },
        "challenging": {
            "focus": "Повече протеин и лек калориен излишък в тренировъчните дни.",
            "macros": "Около 1.8-2.2 г протеин на кг и въглехидрати около тренировките.",
            "meals": "Овес с мляко, пилешко с ориз, банан преди тренировка, извара вечер.",
        },
        "intensive": {
            "focus": "По-сериозно хранене, повече сън и следене на възстановяването.",
            "macros": "2.0-2.2 г протеин на кг, повече въглехидрати и достатъчно калории.",
            "meals": "Закуска с овес и яйца, обяд с месо и ориз, след тренировка банан и протеин, вечеря с картофи и месо.",
        },
        "unrealistic": {
            "focus": "Целта е прекалено агресивна. Първо избери междинна цел, за да не рискуваш травма.",
            "macros": "Поддържай протеин 1.8-2.0 г на кг и не режи калории рязко.",
            "meals": "Яж редовно и следи силата всяка седмица, вместо да гониш огромен скок наведнъж.",
        },
    }

    return {
        "workouts": workouts_by_realism[realism],
        "nutrition": nutrition_by_realism[realism],
    }
