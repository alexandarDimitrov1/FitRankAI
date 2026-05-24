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

    client = _get_firestore_client()
    if not client["ready"]:
        return client

    plan_ref = (
        client["db"]
        .collection("users")
        .document(_safe_document_id(user_id))
        .collection("plans")
        .document()
    )
    plan_ref.set(
        {
            "goal": assessment.goal,
            "deadlineWeeks": assessment.deadline_weeks,
            "fitRankScore": plan_result["fitRank"]["score"],
            "plan": plan_result["plan"],
        }
    )

    return {
        "saved": True,
        "collection": f"users/{user_id}/plans",
        "documentId": plan_ref.id,
    }


def save_user_profile(user_id: str, profile: dict[str, Any]) -> dict[str, Any]:
    status = get_firebase_status()
    if not status["configured"]:
        return {
            "saved": False,
            "reason": "firebase_not_configured",
        }

    client = _get_firestore_client()
    if not client["ready"]:
        return client

    client["db"].collection("users").document(_safe_document_id(user_id)).set(
        profile, merge=True
    )
    return {
        "saved": True,
        "collection": "users",
        "documentId": _safe_document_id(user_id),
    }


def load_user_profile(user_id: str) -> dict[str, Any]:
    status = get_firebase_status()
    if not status["configured"]:
        return {
            "profile": None,
            "storage": {
                "loaded": False,
                "reason": "firebase_not_configured",
            },
        }

    client = _get_firestore_client()
    if not client["ready"]:
        return {
            "profile": None,
            "storage": client,
        }

    document = client["db"].collection("users").document(_safe_document_id(user_id)).get()
    return {
        "profile": document.to_dict() if document.exists else None,
        "storage": {
            "loaded": True,
            "collection": "users",
            "documentId": _safe_document_id(user_id),
        },
    }


def _get_firestore_client() -> dict[str, Any]:
    credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    project_id = os.getenv("FIREBASE_PROJECT_ID")

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        if not firebase_admin._apps:
            firebase_admin.initialize_app(
                credentials.Certificate(credentials_path),
                {"projectId": project_id},
            )

        return {
            "ready": True,
            "db": firestore.client(),
        }
    except Exception as exc:
        return {
            "ready": False,
            "saved": False,
            "reason": "firebase_initialization_failed",
            "detail": str(exc),
        }


def _safe_document_id(user_id: str) -> str:
    return str(user_id).strip().lower().replace("/", "_") or "demo-user"
