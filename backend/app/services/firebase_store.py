import os
from typing import Any

from ..models import FitnessAssessment


def get_firebase_status() -> dict[str, Any]:
    project_id = os.getenv("FIREBASE_PROJECT_ID")
    credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

    return {
        "configured": bool(project_id and credentials_path),
        "projectId": project_id,
        "credentialsPath": credentials_path,
    }


def save_plan_snapshot(
    user_id: str, assessment: FitnessAssessment, plan_result: dict[str, Any]
) -> dict[str, Any]:
    status = get_firebase_status()
    if not status["configured"]:
        return {
            "saved": False,
            "reason": "firebase_not_configured",
        }

    # Firebase Admin initialization will be added once service account keys exist.
    return {
        "saved": False,
        "reason": "firebase_adapter_pending_credentials",
        "collection": f"users/{user_id}/plans",
        "preview": {
            "goal": assessment.goal,
            "fitRankScore": plan_result["fitRank"]["score"],
        },
    }
