// Tiny client-side admin token store. Paired with the backend AdminGuard
// (x-admin-token header). Lives in localStorage so a single prompt on
// /admin unlocks the panel for subsequent visits on the same device.

const KEY = 'sportday.adminToken';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(KEY);
}

export function setAdminToken(token: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, token);
}

export function clearAdminToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}
