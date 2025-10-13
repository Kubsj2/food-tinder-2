import { apiFetch } from "./client";

export async function getRecommendedDishes() {
  const res = await apiFetch("/api/recommended-dishes");
  if (!res.ok) throw new Error("Błąd pobierania dań");
  return res.json();
}

export async function getSwipeCards() {
  const res = await apiFetch("/api/swipe-cards");
  if (!res.ok) throw new Error("Błąd pobierania kart");
  return res.json();
}

export async function sendSwipeDecision(dishId: number, decision: "like" | "dislike") {
  const res = await apiFetch("/api/swipe-decision", {
    method: "POST",
    body: JSON.stringify({ dish_id: dishId, decision }),
  });
  if (res.status !== 204) throw new Error("Błąd wysyłania decyzji");
}
