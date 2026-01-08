import api from "./axios";

export type TitleKind = "MOVIE" | "SERIES";

export function getTitles(kind: "MOVIE" | "SERIES" | "ALL") {
  return api.get(`/titles?kind=${kind}`);
}

export function createTitle(
  token: string,
  data: { name: string; kind: TitleKind; description?: string; posterUrl?: string }
) {
  return api.post("/titles", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getMyTitles(token: string) {
  return api.get("/titles/mine", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateTitle(
  token: string,
  id: string,
  data: Partial<{ name: string; kind: TitleKind; description?: string; posterUrl?: string }>
) {
  return api.patch(`/titles/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function deleteTitle(token: string, id: string) {
  return api.delete(`/titles/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
