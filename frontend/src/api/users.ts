import api from "./axios";

export function getUsers(token: string) {
  return api.get('/users', { headers: { Authorization: `Bearer ${token}` } });
}

export function updateUser(token: string, id: string, data: any) {
  return api.patch(`/users/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });
}

export function deleteUser(token: string, id: string) {
  return api.delete(`/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
}
