import { API_URL } from "../constants/config";

let csrfFetched = false;
let accessToken: string | null = null;

export async function getCsrfToken() {
  if (csrfFetched) return;
  await fetch(`${API_URL}/sanctum/csrf-cookie`, {
    credentials: "include",
  });
  csrfFetched = true;
}

export function setToken(token: string) {
  accessToken = token;
}

export function clearToken() {
  accessToken = null;
  csrfFetched = false;
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  await getCsrfToken();

  const headers: any = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    console.warn("Unauthorized – token wygasł lub błędny");
  }

  return res;
}
