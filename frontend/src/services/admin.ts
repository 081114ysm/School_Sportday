// 클라이언트 측 관리자 토큰 저장소. 백엔드 AdminGuard(x-admin-token 헤더)와 연동한다.
// localStorage에 저장하여 같은 기기에서 재방문 시 재인증 없이 패널에 접근할 수 있다.

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
