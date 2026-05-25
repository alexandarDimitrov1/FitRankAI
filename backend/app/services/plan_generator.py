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
        "Return a detailed day-by-day plan. Each workout day must include main lift, accessory exercises, sets, reps, rest periods, progression guidance, recovery guidance, calories, macros, and example meals."
    )


def _fallback_plan(goal_result: dict) -> dict:
    realism = goal_result["realism"]

    workouts_by_realism = {
        "realistic": [
            "Ден 1: Лежанка 4x5, дъмбел прес 3x8, лицеви опори 3xмакс, трицепс разгъване 3x12. Почивка 2-3 мин.",
            "Ден 2: Клек 4x5, румънска тяга 3x8, напади 3x10 на крак, планк 3x45 сек. Почивка 2-3 мин.",
            "Ден 3: Леко кардио 25 мин, мобилност за рамене и бедра 15 мин, разтягане.",
            "Ден 4: Мъртва тяга 4x4, набирания 4xмакс, гребане с дъмбел 3x10, face pull 3x15. Почивка 2-3 мин.",
            "Ден 5: Техника: лежанка 3x8 с лека тежест, клек 3x8, лицеви опори 3x12, корем 3 кръга.",
        ],
        "challenging": [
            "Ден 1: Тежка лежанка 5x4, дъмбел прес 4x8, лицеви опори 4xмакс, трицепс кофички 3x8. Почивка 3 мин.",
            "Ден 2: Клек 5x4, преден клек 3x6, напади 3x10, корем 4 серии. Почивка 3 мин.",
            "Ден 3: Набирания 5xмакс, гребане 4x8, бицепс 3x12, лека мобилност за гръб.",
            "Ден 4: Мъртва тяга 5x3, румънска тяга 3x8, хип тръст 3x10, задно бедро 3x12.",
            "Ден 5: Обем за целта: избери най-слабото упражнение и направи 6 леки серии по 6-10 повторения.",
            "Ден 6: Леко кардио 20 мин, разтягане, техника с празен лост.",
        ],
        "intensive": [
            "Ден 1: Лежанка 5x3, дъмбел прес 4x8, лицеви опори 5xмакс, трицепс 4x12. Почивка 3 мин.",
            "Ден 2: Клек 5x3, паузиран клек 4x5, напади 3x12, планк 4x45 сек.",
            "Ден 3: Набирания 6 серии, негативни набирания 3x5, гребане 4x10, бицепс 3x12.",
            "Ден 4: Мъртва тяга 5x3, румънска тяга 4x6, хип тръст 4x8, задно бедро 3x12.",
            "Ден 5: Повторение на целта: 70% тежест, 6x4 за основното упражнение, после 3 помощни упражнения по 3 серии.",
            "Ден 6: Лек обем: лицеви опори 4x12, клек с лека тежест 3x10, набирания 4xсубмакс, мобилност.",
            "Ден 7: Пълна почивка, сън, разходка и подготовка за следващата седмица.",
        ],
        "unrealistic": [
            "Седмица 1: Избери междинна цел: +5-10% сила или +2-5 повторения, вместо огромен скок наведнъж.",
            "Ден 1: Лежанка 4x6 с умерена тежест, дъмбел прес 3x10, лицеви опори 3xмакс.",
            "Ден 2: Клек 4x6, румънска тяга 3x8, напади 3x10, мобилност за глезени и бедра.",
            "Ден 4: Мъртва тяга 4x4, набирания 4xсубмакс, гребане 3x10, face pull 3x15.",
            "Ден 6: Техника и възстановяване: празен лост 20 мин, разтягане, леко кардио 15-20 мин.",
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
