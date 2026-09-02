const API_BASE_URL = (import.meta.env.VITE_SKILLPILL_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');
const TOKEN_KEY = 'skillpill-jwt';

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;
export const getToken = () => window.localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => window.localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => window.localStorage.removeItem(TOKEN_KEY);

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  if (response.status === 401) clearToken();
  return response;
}
