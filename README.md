# FitRank AI

FitRank AI is a mobile fitness platform that ranks a user's current fitness level,
checks whether a goal is realistic, and generates a weekly training and nutrition
plan with AI assistance.

The project follows the technologies from the presentation:

- React Native / Expo for one mobile codebase targeting iOS and Android
- Python + Flask for the backend API
- Firebase for users, workouts, and generated plans
- OpenAI API for goal analysis and plan generation

## Repository Structure

```text
backend/   Flask API, FitRank scoring, Firebase and AI service adapters
mobile/    React Native app scaffold for the FitRank AI user experience
docs/      Architecture notes and implementation roadmap
```

## First Milestone

The first working version should let a user enter:

- biometrics: weight, height, age, activity level
- exercise results: push-ups, squats, plank time, run time
- target goal and deadline

The backend calculates a FitRank score, estimates goal realism, and returns an AI
ready prompt for a weekly workout and nutrition plan.

## Local Setup

Backend setup:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
flask --app app run
```

Mobile setup:

```bash
cd mobile
npm install
npm run start
```

Create a local backend `.env` file from `backend/.env.example` before calling
OpenAI or Firebase services.
