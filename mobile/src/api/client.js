const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";


export async function requestPlan(payload) {
  try {
    const response = await fetch(`${API_URL}/api/plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Plan request failed with status ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.warn("Unable to request plan", error);
    return null;
  }
}
