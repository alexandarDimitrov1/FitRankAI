const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";


export async function saveProfile(profile) {
  return postJson("/api/profile", { profile }, profile.email);
}


export async function requestPlan(payload, userId) {
  return postJson("/api/plan", payload, userId);
}


async function postJson(path, payload, userId) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-FitRank-User": userId || "demo-user"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.warn("Unable to reach FitRank API", error);
    return null;
  }
}
