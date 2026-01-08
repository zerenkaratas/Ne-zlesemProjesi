import api from "./axios";

export async function login(login: string, password: string) {
  const res = await api.post("/auth/login", { login, password });
  return res.data; // { access_token }
}

export async function register(
  username: string,
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
  avatar?: 'male' | 'female'
) {
  const res = await api.post("/auth/register", {
    username,
    email,
    password,
    firstName,
    lastName,
    avatar,
  });
  return res.data; // { id, username, email, role }
}

export async function getMe(token: string) {
  const res = await api.get("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // { userId, role }
}
