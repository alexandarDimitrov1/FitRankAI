# FitRank AI Architecture

## Product Flow

1. The mobile app collects biometrics, training results, current activity level,
   goal, and deadline.
2. The Flask API normalizes the data and calculates a FitRank score from 0 to 100.
3. The backend stores user inputs and generated plans in Firebase.
4. The AI service builds a structured prompt for GPT and returns a weekly workout
   and nutrition plan.
5. The mobile app shows the user's rank, goal realism, and next plan.

## Main Components

- Mobile app: React Native with Expo for iOS and Android from one codebase.
- API: Flask application with JSON endpoints under `/api`.
- Scoring engine: deterministic Python service that can be tested without OpenAI.
- AI planner: OpenAI adapter that receives validated fitness context.
- Storage: Firebase Admin SDK for users, workouts, rankings, and plans.

## Data Model Draft

```text
users/{userId}
  profile:
    age
    heightCm
    weightKg
    activityLevel

users/{userId}/assessments/{assessmentId}
  exerciseResults
  fitRankScore
  percentileLabel
  createdAt

users/{userId}/plans/{planId}
  goal
  deadlineWeeks
  realism
  workouts
  nutrition
  createdAt
```

## API Draft

- `GET /health` confirms that the backend is running.
- `POST /api/rank` calculates FitRank score and percentile label.
- `POST /api/plan` evaluates a goal and prepares a training plan response.

The first implementation keeps scoring deterministic so the app can work even
before Firebase and OpenAI credentials are configured.
