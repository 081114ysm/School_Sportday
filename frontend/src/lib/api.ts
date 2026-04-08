import { Team, Match, RankingEntry } from './types';
import { BASE_URL } from './config';

// Works in both server and client components. We disable Next's fetch cache
// so SSR always sees fresh data — for realtime features this is required.
// Non-GET requests auto-attach the admin token from localStorage so admin
// actions don't need to plumb headers through every callsite.
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
    // 401 on an admin-gated route → stored token is stale/wrong. Clear it and
    // notify the UI so the admin page can re-prompt without a page reload.
    if (res.status === 401 && typeof window !== 'undefined') {
      window.localStorage.removeItem('sportday.adminToken');
      window.dispatchEvent(new Event('sportday:admin-unauthorized'));
    }
    throw new Error(`API error ${res.status}: ${errorBody}`);
  }
  // 204 No Content or empty body (e.g. DELETE) → return undefined cast as T.
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

// Teams
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

// Matches
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
  return request<Match[]>(`/api/matches${query}`);
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

// Rankings
export async function fetchRankings(grade?: number): Promise<RankingEntry[]> {
  const query = grade ? `?grade=${grade}` : '';
  return request<RankingEntry[]>(`/api/rankings${query}`);
}
