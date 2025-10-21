import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

type LoginPayload = { email: string; password: string };
type SwipeDecisionPayload = { dish_id: number; decision: 'like' | 'dislike' };

type Parameter = {
  id: number;
  name: string;
  type: 'category' | 'cuisine' | 'flavour' | 'other';
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

function joinUrl(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL.replace(/\/$/, '')}${p}`;
}

function isFormDataBody(body: any) {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

async function authFetch(path: string, init: RequestInit = {}) {
  const token = await AsyncStorage.getItem('token');
  const headers = new Headers(init.headers);

  // Zawsze Accept JSON
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  // Content-Type ustawiamy domyślnie tylko dla JSON
  const hasCT = [...headers.keys()].some((k) => k.toLowerCase() === 'content-type');
  if (!hasCT && !isFormDataBody(init.body)) headers.set('Content-Type', 'application/json');

  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(joinUrl(path), { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res;
}

async function jsonFetch<T = any>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const res = await fetch(joinUrl(path), { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

/** Ujednolicenie pełnego URL obrazka */
function buildFullImageUrl(rel?: string | null) {
  if (!rel) return undefined;
  if (/^https?:\/\//i.test(rel)) return rel;
  // jeśli API poda sam plik, załóż /storage/<plik>
  let normalized = rel.replace(/^\//, '');
  if (!/^storage\//.test(normalized)) normalized = `storage/${normalized}`;
  return `${BASE_URL.replace(/\/$/, '')}/${normalized}`;
}

/** Normalizacja pól obrazka dla spójności z komponentami UI */
export function normalizeDish<T extends Dish>(d: T): T {
  return {
    ...d,
    image_url_full: d.image_url_full ?? buildFullImageUrl(d.image_url ?? undefined),
  };
}

/* ========= Auth ========= */

async function login(payload: LoginPayload) {
  // Spec pokazuje tablicę w requestBody, ale to najpewniej literówka.
  // Wysyłamy obiekt; w razie 422 spróbujemy jeszcze raz jako [payload].
  try {
    return await jsonFetch<{ token: string; user: any }>('api/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (e: any) {
    if (String(e?.message || '').includes('422')) {
      return await jsonFetch<{ token: string; user: any }>('api/login', {
        method: 'POST',
        body: JSON.stringify([payload]),
      });
    }
    throw e;
  }
}

async function logout() {
  const res = await authFetch('/api/logout', { method: 'POST' });
  return res.json();
}

async function verifyEmail(id: number, hash: string) {
  // wymaga Bearer token
  return authFetch(`/api/verify-email/${id}/${hash}`, { method: 'GET' });
}

/* ========= Swipes & Recommendations ========= */

async function getSwipeCards(limit = 5) {
  const res = await authFetch(`/api/swipe-cards?limit=${limit}`, { method: 'GET' });
  const data = (await res.json()) as Dish[];
  return data.map(normalizeDish);
}

async function postSwipeDecision(payload: SwipeDecisionPayload) {
  await authFetch('/api/swipe-decision', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function getRecommendedDishes(limit = 10) {
  const res = await authFetch(`/api/recommended-dishes?limit=${limit}`, { method: 'GET' });
  const data = (await res.json()) as DishWithScore[];
  return data.map(normalizeDish);
}

/* ========= Dishes CRUD ========= */

async function listDishes() {
  const res = await authFetch('/api/dishes', { method: 'GET' });
  const data = (await res.json()) as Dish[];
  return data.map(normalizeDish);
}

async function getDish(id: number) {
  const res = await authFetch(`/api/dishes/${id}`, { method: 'GET' });
  return normalizeDish(await res.json());
}

async function createDish(form: FormData) {
  // NIE ustawiaj Content-Type — RN doda boundary
  const res = await authFetch('/api/dishes', { method: 'POST', body: form });
  return normalizeDish(await res.json());
}

async function updateDish(id: number, body: FormData | Record<string, any>) {
  const init: RequestInit =
    typeof FormData !== 'undefined' && body instanceof FormData
      ? { method: 'PUT', body }
      : { method: 'PUT', body: JSON.stringify(body) };
  const res = await authFetch(`/api/dishes/${id}`, init);
  return normalizeDish(await res.json());
}

async function deleteDish(id: number) {
  const res = await authFetch(`/api/dishes/${id}`, { method: 'DELETE' });
  return res.json();
}

export const api = {
  // auth
  login,
  logout,
  verifyEmail,

  // swipes & recs
  getSwipeCards,
  postSwipeDecision,
  getRecommendedDishes,

  // dishes
  listDishes,
  getDish,
  createDish,
  updateDish,
  deleteDish,
};
