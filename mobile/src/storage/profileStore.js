const PROFILE_KEY = "fitrank_profile";


export async function loadStoredProfile() {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const value = storage.getItem(PROFILE_KEY);
  return value ? JSON.parse(value) : null;
}


export async function saveStoredProfile(profile) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  if (!profile) {
    storage.removeItem(PROFILE_KEY);
    return;
  }

  storage.setItem(PROFILE_KEY, JSON.stringify(profile));
}


function getStorage() {
  if (typeof globalThis !== "undefined" && globalThis.localStorage) {
    return globalThis.localStorage;
  }

  return null;
}
