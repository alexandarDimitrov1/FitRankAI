import unittest

from app.models import Biometrics, ExerciseResults, FitnessAssessment
from app.services.fitrank import calculate_fitrank, evaluate_goal
from app.services.plan_generator import build_plan_response


class PlanGeneratorTests(unittest.TestCase):
    def test_fallback_plan_includes_ai_status_without_api_key(self):
        assessment = FitnessAssessment(
            biometrics=Biometrics(
                age=22,
                height_cm=180,
                weight_kg=78,
                activity_level="moderate",
            ),
            exercise_results=ExerciseResults(
                pushups=35,
                bench_kg=85,
                pullups=8,
                squat_kg=110,
                deadlift_kg=140,
            ),
            goal_targets=ExerciseResults(
                pushups=45,
                bench_kg=95,
                pullups=12,
                squat_kg=125,
                deadlift_kg=155,
            ),
            goal="Build strength and improve conditioning",
            deadline_weeks=8,
        )
        rank_result = calculate_fitrank(assessment)
        goal_result = evaluate_goal(assessment, rank_result["score"])

        response = build_plan_response(assessment, rank_result, goal_result)

        self.assertFalse(response["ai"]["generated"])
        self.assertEqual(response["ai"]["provider"], "openai")
        self.assertGreater(len(response["plan"]["workouts"]), 0)
        self.assertIn("FitRank score", response["aiPrompt"])
        self.assertIn("Target results", response["aiPrompt"])
        self.assertIn("meals", response["plan"]["nutrition"])


if __name__ == "__main__":
    unittest.main()
