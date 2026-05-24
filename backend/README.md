# FitRank AI Backend

Python + Flask API for FitRank scoring, goal realism, Firebase persistence, and
OpenAI plan generation.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
flask --app app run
```

Copy `.env.example` to `.env` and fill the values needed for Firebase and OpenAI.

## Endpoints

- `GET /health`
- `POST /api/rank`
- `POST /api/plan`
