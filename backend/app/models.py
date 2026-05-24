from dataclasses import dataclass


@dataclass(frozen=True)
class Biometrics:
    age: int
    height_cm: float
    weight_kg: float
    activity_level: str


@dataclass(frozen=True)
class ExerciseResults:
    pushups: int
    squats: int
    plank_seconds: int
    run_minutes: float


@dataclass(frozen=True)
class FitnessAssessment:
    biometrics: Biometrics
    exercise_results: ExerciseResults
    goal: str | None = None
    deadline_weeks: int | None = None
