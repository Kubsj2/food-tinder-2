import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type LoginPayload = { email: string; password: string };
type SwipeDecisionPayload = { dish_id: number; decision: "like" | "dislike" };

type Parameter = {
  id: number;
  name: string;
  type: "category" | "cuisine" | "flavour" | "other";
  value?: number;
  is_active?: boolean;
};

export type Dish = {
  id: number;
  name: string;
  description?: string | null;
  image_url?: string | null;
  image_url_full?: string | null;
  parameters?: Parameter[];
};

export type DishWithScore = Dish & { match_score?: number };

/* ========== helpers ========== */

function isAbsoluteUrl(u: string) {
  return /^https?:\/\//i.test(u);
}

function joinUrl(path: string) {
  if (isAbsoluteUrl(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL.replace(/\/$/, "")}${p}`;
}

function isFormDataBody(body: any) {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function appendQuery(url: string, key: string, val: string) {
  const hasQuery = url.includes("?");
  const sep = hasQuery ? "&" : "?";
  return `${url}${sep}${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
}

async function authFetch(pathOrUrl: string, init: RequestInit = {}) {
  const token = await AsyncStorage.getItem("token");
  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  const hasCT = [...headers.keys()].some(
    (k) => k.toLowerCase() === "content-type"
  );
  if (!hasCT && !isFormDataBody(init.body))
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const url = joinUrl(pathOrUrl);
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res;
}

async function authFetchAbsolute(fullUrl: string, init: RequestInit = {}) {
  // pełny URL (np. http://127.0.0.1:8000/api/swipe-cards-by-parameter/14)
  const token = await AsyncStorage.getItem("token");
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  const hasCT = [...headers.keys()].some(
    (k) => k.toLowerCase() === "content-type"
  );
  if (!hasCT && !isFormDataBody(init.body))
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(fullUrl, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res;
}

/** Ujednolicenie pełnego URL obrazka */
function buildFullImageUrl(rel?: string | null) {
  if (!rel) return undefined;
  if (isAbsoluteUrl(rel)) return rel;
  let normalized = rel.replace(/^\//, "");
  if (!/^storage\//.test(normalized)) normalized = `storage/${normalized}`;
  return `${BASE_URL.replace(/\/$/, "")}/${normalized}`;
}

/** Normalizacja pól obrazka dla spójności z komponentami UI */
export function normalizeDish<T extends Dish>(d: T): T {
  return {
    ...d,
    image_url_full:
      d.image_url_full ?? buildFullImageUrl(d.image_url ?? undefined),
  };
}

/* ========= Auth ========= */

async function login(payload: LoginPayload) {
  // Spec wskazuje tablicę w requestBody; próbujemy najpierw obiekt, a gdy 422 — tablicę.
  try {
    const res = await authFetch("/api/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return (await res.json()) as { token: string; user: any };
  } catch (e: any) {
    if (String(e?.message || "").includes("422")) {
      const res = await authFetch("/api/login", {
        method: "POST",
        body: JSON.stringify([payload]),
      });
      return (await res.json()) as { token: string; user: any };
    }
    throw e;
  }
}

async function logout() {
  const res = await authFetch("/api/logout", { method: "POST" });
  return res.json();
}

async function verifyEmail(id: number, hash: string) {
  return authFetch(`/api/verify-email/${id}/${hash}`, { method: "GET" });
}

/* ========= Swipes & Recommendations ========= */

async function getSwipeCards(limit = 5) {
  const res = await authFetch(`/api/swipe-cards?limit=${limit}`, {
    method: "GET",
  });
  const data = (await res.json()) as Dish[];
  return data.map(normalizeDish);
}

/** Preferuje pełny link z /api/get-the-most-popular-parameters (swipe-cards-by-parameter/{id}) */
async function getSwipeCardsByParameterLink(fullLink: string, limit = 5) {
  const url = appendQuery(fullLink, "limit", String(limit));
  const res = isAbsoluteUrl(url)
    ? await authFetchAbsolute(url, { method: "GET" })
    : await authFetch(url, { method: "GET" });
  const data = (await res.json()) as Dish[];
  return data.map(normalizeDish);
}

/** Fallback, jeśli chcesz wymusić ścieżkę po samym id (gdy backend wspiera /api/swipe-cards/{id}) */
async function getSwipeCardsByParameter(id: number, limit = 5) {
  const res = await authFetch(`/api/swipe-cards/${id}?limit=${limit}`, {
    method: "GET",
  });
  const data = (await res.json()) as Dish[];
  return data.map(normalizeDish);
}

async function postSwipeDecision(payload: SwipeDecisionPayload) {
  await authFetch("/api/swipe-decision", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Paginated recommendations: spec zwraca paginator z polem `data` */
async function getRecommendedDishes(perPage = 10, page = 1) {
  const res = await authFetch(
    `/api/recommended-dishes?per_page=${perPage}&page=${page}`,
    { method: "GET" }
  );
  const payload = await res.json();
  const items = Array.isArray(payload?.data)
    ? (payload.data as DishWithScore[])
    : [];
  return items.map(normalizeDish);
}

/** Zwraca tablicę URL-i do endpointu kart po parametrze */
async function getPopularParameterLinks(limit = 6) {
  const res = await authFetch(
    `/api/get-the-most-popular-parameter?limit=${limit}`,
    { method: "GET" }
  );
  return (await res.json()) as string[];
}

/** Szczegóły parametru (nazwy/typ) */
async function getParameter(id: number) {
  const res = await authFetch(`/api/parameter/${id}`, { method: "GET" });
  return (await res.json()) as Parameter;
}

/* ========= Dishes CRUD ========= */

async function listDishes() {
  const res = await authFetch("/api/dishes", { method: "GET" });
  const payload = await res.json();
  const items: Dish[] = Array.isArray(payload?.data) ? payload.data : [];
  return items.map(normalizeDish);
}

async function getDish(id: number) {
  const res = await authFetch(`/api/dishes/${id}`, { method: "GET" });
  return normalizeDish(await res.json());
}

async function createDish(form: FormData) {
  const res = await authFetch("/api/dishes", { method: "POST", body: form });
  return normalizeDish(await res.json());
}

async function updateDish(id: number, body: FormData | Record<string, any>) {
  const init: RequestInit =
    typeof FormData !== "undefined" && body instanceof FormData
      ? { method: "PUT", body }
      : { method: "PUT", body: JSON.stringify(body) };
  const res = await authFetch(`/api/dishes/${id}`, init);
  return normalizeDish(await res.json());
}

async function deleteDish(id: number) {
  const res = await authFetch(`/api/dishes/${id}`, { method: "DELETE" });
  return res.json();
}

export const api = {
  // auth
  login,
  logout,
  verifyEmail,

  // swipes & recs
  getSwipeCards,
  getSwipeCardsByParameterLink,
  getSwipeCardsByParameter, // fallback
  postSwipeDecision,
  getRecommendedDishes,
  getPopularParameterLinks,
  getParameter,

  // dishes
  listDishes,
  getDish,
  createDish,
  updateDish,
  deleteDish,
};
