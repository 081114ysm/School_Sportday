import { Team, Match, RankingEntry } from '@/types';
import { BASE_URL } from './config';

// 서버·클라이언트 컴포넌트 모두에서 동작한다. Next의 fetch 캐시를 비활성화해
// SSR이 항상 최신 데이터를 조회하도록 한다 — 실시간 기능에 필수.
// GET 이외 요청은 localStorage의 관리자 토큰을 자동으로 첨부하므로
// 각 호출부에서 헤더를 별도로 전달할 필요가 없다.
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const method = (options?.method ?? 'GET').toUpperCase();
  const adminHeaders: Record<string, string> = {};
  if (method !== 'GET' && typeof window !== 'undefined') {
    const token = window.localStorage.getItem('sportday.adminToken');
    if (token) adminHeaders['x-admin-token'] = token;
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    cache: 'no-store',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...adminHeaders,
      ...(options?.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    // 관리자 전용 라우트에서 401 → 저장된 토큰이 만료되거나 잘못됨. 토큰을 삭제하고
    // 이벤트를 발행해 페이지 리로드 없이 관리자 페이지가 재인증을 유도하게 한다.
    if (res.status === 401 && typeof window !== 'undefined') {
      window.localStorage.removeItem('sportday.adminToken');
      window.dispatchEvent(new Event('sportday:admin-unauthorized'));
    }
    throw new Error(`API error ${res.status}: ${errorBody}`);
  }
  // 204 No Content 또는 빈 응답(예: DELETE) → undefined를 T로 캐스팅해 반환.
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/admin/verify`, {
      method: 'GET',
      cache: 'no-store',
      headers: { 'x-admin-token': token },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// 팀
export async function fetchTeams(grade?: number): Promise<Team[]> {
  const query = grade ? `?grade=${grade}` : '';
  return request<Team[]>(`/api/teams${query}`);
}

export async function createTeam(data: { name: string; grade: number; classNumber: number }): Promise<Team> {
  return request<Team>('/api/teams', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteTeam(id: number): Promise<void> {
  await request<void>(`/api/teams/${id}`, { method: 'DELETE' });
}

export async function deleteAllMatches(): Promise<{ deleted: number }> {
  return request<{ deleted: number }>(`/api/matches/all`, { method: 'DELETE' });
}

export async function deleteLastWeekMatches(): Promise<{ deleted: number; before: string }> {
  return request<{ deleted: number; before: string }>(`/api/matches/last-week`, { method: 'DELETE' });
}

export async function updateTeamPoints(id: number, pointsAdjustment: number): Promise<Team> {
  return request<Team>(`/api/teams/${id}/points`, {
    method: 'PUT',
    body: JSON.stringify({ pointsAdjustment }),
  });
}

// 오늘 날짜(YYYY-MM-DD, 로컬).
function todayYmdLocal(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// matchDate가 오늘보다 과거이고 LIVE가 아닌 경기는 status를 DONE으로 정규화.
// 백엔드 auto-finalize가 10분 간격으로 돌지만 프론트에서 즉시 반영되도록 한다.
function normalizePastStatus(matches: Match[]): Match[] {
  const today = todayYmdLocal();
  return matches.map((m) => {
    if (m.status === 'LIVE' || m.status === 'DONE') return m;
    if (!m.matchDate) return m;
    if (m.matchDate < today) return { ...m, status: 'DONE' };
    return m;
  });
}

// 경기
export async function fetchMatches(filters?: {
  sport?: string;
  day?: string;
  matchDate?: string;
  status?: string;
  category?: string;
}): Promise<Match[]> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  const query = params.toString() ? `?${params.toString()}` : '';
  const list = await request<Match[]>(`/api/matches${query}`);
  return normalizePastStatus(list);
}

export async function fetchLiveMatches(): Promise<Match[]> {
  return request<Match[]>('/api/matches/live');
}

export async function createMatch(data: {
  sport: string;
  day: string;
  matchDate?: string;
  timeSlot: string;
  teamAId: number;
  teamBId: number;
  category: string;
  quarterCount?: number;
  quarterMinutes?: number;
  bracketStage?: string | null;
}): Promise<Match> {
  return request<Match>('/api/matches', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMatch(id: number, data: Partial<Match>): Promise<Match> {
  return request<Match>(`/api/matches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteMatch(id: number): Promise<void> {
  await request<void>(`/api/matches/${id}`, { method: 'DELETE' });
}

export async function updateScore(
  id: number,
  team: 'A' | 'B',
  delta: number
): Promise<Match> {
  return request<Match>(`/api/matches/${id}/score`, {
    method: 'PUT',
    body: JSON.stringify({ team, delta }),
  });
}

export async function updateMatchStatus(
  id: number,
  status: 'SCHEDULED' | 'LIVE' | 'DONE'
): Promise<Match> {
  return request<Match>(`/api/matches/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function updateSetScore(
  id: number,
  setIndex: number,
  team: 'A' | 'B',
  delta: number,
): Promise<Match> {
  return request<Match>(`/api/matches/${id}/set-score`, {
    method: 'PUT',
    body: JSON.stringify({ setIndex, team, delta }),
  });
}

export async function updateQuarter(
  id: number,
  currentQuarter: number | null,
  quarterStartedAt: string | null,
): Promise<Match> {
  return request<Match>(`/api/matches/${id}/quarter`, {
    method: 'PUT',
    body: JSON.stringify({ currentQuarter, quarterStartedAt }),
  });
}

export async function undoScore(id: number): Promise<Match> {
  return request<Match>(`/api/matches/${id}/undo`, {
    method: 'PUT',
  });
}

export async function setMatchScore(
  id: number,
  homeScore: number,
  awayScore: number,
): Promise<Match> {
  return request<Match>(`/api/matches/${id}/score`, {
    method: 'PATCH',
    body: JSON.stringify({ homeScore, awayScore }),
  });
}

export async function setMatchYoutube(id: number, youtubeUrl: string | null): Promise<Match> {
  return request<Match>(`/api/matches/${id}/youtube`, {
    method: 'PUT',
    body: JSON.stringify({ youtubeUrl }),
  });
}

// 랭킹
export async function fetchRankings(grade?: number): Promise<RankingEntry[]> {
  const query = grade ? `?grade=${grade}` : '';
  return request<RankingEntry[]>(`/api/rankings${query}`);
}
