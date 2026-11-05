// ===== Cliente de la API del bot para el panel de moderación =====
// Añade automáticamente el token de administración a todas las peticiones.

export const API_URL = (import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3001/api')).replace(/\/$/, '');

const TOKEN_KEY = 'primate_admin_token';
const TWITCH_USER_KEY = 'primate_twitch_user';

export const getToken = () => sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || '';

export function setToken(token, remember = false) {
  clearToken();
  (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TWITCH_USER_KEY);
  localStorage.removeItem(TWITCH_USER_KEY);
}

export const getTwitchUser = () => {
  try {
    const raw = sessionStorage.getItem(TWITCH_USER_KEY) || localStorage.getItem(TWITCH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function setTwitchUser(user, remember = false) {
  if (!user) return;
  (remember ? localStorage : sessionStorage).setItem(TWITCH_USER_KEY, JSON.stringify(user));
}

// Configuración de Twitch en el backend
export async function fetchTwitchConfig() {
  try {
    const res = await fetch(`${API_URL}/auth/twitch/config`);
    if (!res.ok) return { enabled: false };
    return await res.json();
  } catch {
    return { enabled: false };
  }
}

// Verificación de credenciales de Twitch
export async function verifyTwitchAuth({ token, code, redirectUri }) {
  const res = await fetch(`${API_URL}/auth/twitch/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, code, redirectUri }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error || `Error ${res.status}` };
  }
  return { ok: true, token: data.token, user: data.user };
}

// fetch con el token incluido. Si la API responde 401 se cierra la sesión del panel.
export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event('primate:unauthorized'));
  }
  return res;
}

// Comprueba si un token es válido contra la API
export async function checkToken(token) {
  const res = await fetch(`${API_URL}/auth/check`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return { ok: false, error: 'Token incorrecto' };
  if (res.status === 429) return { ok: false, error: 'Demasiados intentos. Espera unos minutos.' };
  if (!res.ok) return { ok: false, error: `Error ${res.status}` };
  return { ok: true };
}
