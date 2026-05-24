import os
from typing import Any


def get_firebase_status() -> dict[str, Any]:
    project_id = os.getenv("FIREBASE_PROJECT_ID")
    credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

    return {
        "configured": bool(project_id and credentials_path),
        "projectId": project_id,
        "credentialsPath": credentials_path,
    }
