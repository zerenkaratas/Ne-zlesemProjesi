import api from "./axios";

export function getLists(kind: "MOVIE" | "SERIES" | "ALL") {
  return api.get(`/lists?kind=${kind}`);
}

export function addToList(type: "WATCHED" | "CONTINUE" | "WISHLIST", titleId: string) {
  return api.post(`/lists/${type}/add`, { titleId });
}
