import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

type LoginPayload = { email: string; password: string };
type DecisionPayload = { dish_id: number; decision: 'like' | 'dislike' };

async function authFetch(path: string, init?: RequestInit) {
  const token = await AsyncStorage.getItem('token');
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res;
}

async function login(payload: LoginPayload) {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

async function getSwipeCards() {
  const res = await authFetch('/api/swipe-cards', { method: 'GET' });
  return res.json();
}

async function postSwipeDecision(payload: DecisionPayload) {
  await authFetch('/api/swipe-decision', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function getRecommendedDishes() {
  const res = await authFetch('/api/recommended-dishes', { method: 'GET' });
  return res.json();
}

export const api = {
  login,
  getSwipeCards,
  postSwipeDecision,
  getRecommendedDishes,
};
