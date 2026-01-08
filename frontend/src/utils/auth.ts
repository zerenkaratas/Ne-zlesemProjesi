export function getToken() {
  return localStorage.getItem("token");
}
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("me");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function setProfile(profile: any) {
  try {
    localStorage.setItem("me", JSON.stringify(profile));
  } catch (e) {}
}

export function getProfile() {
  const s = localStorage.getItem("me");
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
}

