import unittest

from app.models import Biometrics, ExerciseResults, FitnessAssessment
from app.services.fitrank import calculate_fitrank, evaluate_goal


class FitRankTests(unittest.TestCase):
    def test_score_is_in_expected_range(self):
        assessment = FitnessAssessment(
            biometrics=Biometrics(
                age=22,
                height_cm=180,
                weight_kg=78,
                activity_level="moderate",
            ),
            exercise_results=ExerciseResults(
                pushups=35,
                squats=55,
                plank_seconds=120,
                run_minutes=11,
            ),
        )

        result = calculate_fitrank(assessment)

        self.assertGreaterEqual(result["score"], 0)
        self.assertLessEqual(result["score"], 100)
        self.assertIn("breakdown", result)

    def test_short_deadline_marks_goal_as_aggressive_for_lower_score(self):
        assessment = FitnessAssessment(
            biometrics=Biometrics(
                age=18,
                height_cm=170,
                weight_kg=70,
                activity_level="low",
            ),
            exercise_results=ExerciseResults(
                pushups=5,
                squats=10,
                plank_seconds=30,
                run_minutes=20,
            ),
            goal="Reach advanced score",
            deadline_weeks=2,
        )

        score = calculate_fitrank(assessment)["score"]
        result = evaluate_goal(assessment, score)

        self.assertEqual(result["realism"], "aggressive")


if __name__ == "__main__":
    unittest.main()
