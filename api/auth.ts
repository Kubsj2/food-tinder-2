import { apiFetch, setToken, clearToken } from "./client";

export async function login(email: string, password: string) {
  const res = await apiFetch("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error("Błąd logowania");

  // Laravel Sanctum zwraca token JWT / Bearer
  const data = await res.json();
  setToken(data.token);
  return data;
}

export async function register(email: string, password: string) {
  const res = await apiFetch("/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error("Błąd rejestracji");

  const data = await res.json();
  return data;
}

export async function logout() {
  await apiFetch("/logout", { method: "POST" });
  clearToken();
}
