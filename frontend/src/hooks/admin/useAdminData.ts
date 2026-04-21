'use client';

import { useState, useEffect, useCallback } from 'react';
import { Match, Team } from '@/types';
import { getAdminToken, setAdminToken, clearAdminToken } from '@/services/admin';
import {
  fetchMatches,
  fetchTeams,
  createMatch,
  deleteMatch,
  createTeam,
  deleteTeam,
  updateMatch,
  updateScore,
  updateSetScore,
  updateMatchStatus,
  undoScore,
  setMatchYoutube,
  verifyAdminToken,
  updateQuarter,
} from '@/services/api';
import { getSocket, disconnectSocket } from '@/services/socket';
import {
  effectiveStatus,
  isMultiSet,
  parseSets,
  todayYmd,
  dayLabelFromDate,
} from '@/components/admin/adminUtils';
import { SPORTS, TIME_SLOTS, CATEGORIES } from '@/components/admin/adminConstants';

export function useAdminData() {
  // 인증 상태
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [tokenInput, setTokenInput] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (getAdminToken()) setAuthorized(true);

    // API 레이어가 401을 받으면 토큰을 지우고 이 이벤트를 발행한다.
    // 그러면 관리자 페이지는 자동으로 로그인 프롬프트로 복귀한다.
    const onUnauthorized = () => {
      setAuthorized(false);
      setAuthError('비밀번호가 만료되었거나 잘못되었습니다. 다시 입력해 주세요.');
      setTokenInput('');
    };
    window.addEventListener('sportday:admin-unauthorized', onUnauthorized);
    return () => window.removeEventListener('sportday:admin-unauthorized', onUnauthorized);
  }, []);

  const handleLogin = async () => {
    const t = tokenInput.trim();
    if (!t) {
      setAuthError('비밀번호를 입력해주세요.');
      return;
    }
    const ok = await verifyAdminToken(t);
    if (!ok) {
      setAuthError('비밀번호가 올바르지 않습니다.');
      alert('비밀번호가 올바르지 않습니다.');
      return;
    }
    setAdminToken(t);
    setAuthError('');
    setAuthorized(true);
  };

  const handleLogout = () => {
    clearAdminToken();
    setAuthorized(false);
    setTokenInput('');
  };

  // 경기·팀 데이터
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [matchData, teamData] = await Promise.all([
        fetchMatches().catch(() => []),
        fetchTeams().catch(() => []),
      ]);
      setTeams(teamData);

      // 저장된 상태를 날짜 기반 상태로 자동 동기화한다: 과거 경기는 DONE,
      // 미래 경기는 SCHEDULED로 전환. LIVE 상태는 유지.
      const toFix = matchData.filter(m => {
        const eff = effectiveStatus(m);
        return eff !== m.status && m.status !== 'LIVE';
      });
      if (toFix.length > 0) {
        const updated = await Promise.all(
          toFix.map(m => updateMatchStatus(m.id, effectiveStatus(m)).catch(() => null)),
        );
        const updatedMap = new Map(updated.filter((x): x is Match => !!x).map(m => [m.id, m]));
        setMatches(matchData.map(m => updatedMap.get(m.id) ?? m));
      } else {
        setMatches(matchData);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }, []);

  useEffect(() => {
    if (!authorized) return;
    loadData();
  }, [loadData, authorized]);

  useEffect(() => {
    const socket = getSocket();

    socket.on('matchUpdate', (updatedMatch: Match) => {
      setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
    });

    socket.on('scoreUpdate', (data: { matchId: number; scoreA: number; scoreB: number }) => {
      setMatches(prev =>
        prev.map(m => m.id === data.matchId ? { ...m, scoreA: data.scoreA, scoreB: data.scoreB } : m)
      );
    });

    socket.on('matchCreated', (newMatch: Match) => {
      setMatches(prev => [...prev, newMatch]);
    });

    socket.on('matchDeleted', (data: { id: number }) => {
      setMatches(prev => prev.filter(m => m.id !== data.id));
    });

    return () => {
      socket.off('matchUpdate');
      socket.off('scoreUpdate');
      socket.off('matchCreated');
      socket.off('matchDeleted');
      disconnectSocket();
    };
  }, []);

  // 실시간 점수 입력 상태
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [activeSet, setActiveSet] = useState<number>(0); // volleyball 3-set

  const selectedMatch = matches.find(m => m.id === selectedMatchId) || null;

  // 배구·배드민턴: 선택된 경기의 점수가 업데이트될 때마다 활성 세트 표시자를
  // 첫 번째 미완료 세트로 자동 이동한다. 듀스 규칙을 포함해 판정한다.
  useEffect(() => {
    if (!selectedMatch || !isMultiSet(selectedMatch.sport)) return;
    const sets = parseSets(selectedMatch.setsJson);
    const sport = selectedMatch.sport;
    const isVb = sport === 'BIG_VOLLEYBALL' || sport === '빅발리볼';
    const isBd = sport === 'BADMINTON' || sport === '배드민턴';
    const done = (a: number, b: number): boolean => {
      if (isVb) return (a >= 25 && a - b >= 2) || (b >= 25 && b - a >= 2);
      if (isBd) return a >= 30 || b >= 30 || (a >= 21 && a - b >= 2) || (b >= 21 && b - a >= 2);
      return false;
    };
    const idx = sets.findIndex(s => !done(s.a, s.b));
    setActiveSet(idx === -1 ? 2 : idx);
  }, [selectedMatch?.id, selectedMatch?.setsJson]);

  const handleScoreUpdate = async (team: 'A' | 'B', delta: number) => {
    if (!selectedMatchId) return;
    const sel = matches.find(m => m.id === selectedMatchId);
    try {
      setLoading(true);
      const updated = sel && isMultiSet(sel.sport)
        ? await updateSetScore(selectedMatchId, activeSet, team, delta)
        : await updateScore(selectedMatchId, team, delta);
      setMatches(prev => prev.map(m => m.id === updated.id ? updated : m));
    } catch (err) {
      console.error('Score update failed:', err);
      alert('점수 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!selectedMatchId) return;
    try {
      setLoading(true);
      const updated = await undoScore(selectedMatchId);
      setMatches(prev => prev.map(m => m.id === updated.id ? updated : m));
    } catch (err) {
      console.error('Undo failed:', err);
      alert('실행 취소에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuarter = async () => {
    if (!selectedMatchId || !selectedMatch) return;
    const total = selectedMatch.quarterCount ?? 4;
    const cur = selectedMatch.currentQuarter ?? 0;
    const next = Math.min(total, cur + 1);
    try {
      setLoading(true);
      const updated = await updateQuarter(selectedMatchId, next, new Date().toISOString());
      setMatches(prev => prev.map(m => m.id === updated.id ? updated : m));
    } catch (err) {
      console.error('Quarter update failed:', err);
      alert('쿼터 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseQuarter = async () => {
    if (!selectedMatchId || !selectedMatch) return;
    try {
      setLoading(true);
      // 재개: quarterStartedAt이 null이면 다시 지금 시각으로, 아니면 null로 일시정지.
      const pausing = selectedMatch.quarterStartedAt != null;
      const updated = await updateQuarter(
        selectedMatchId,
        selectedMatch.currentQuarter ?? 1,
        pausing ? null : new Date().toISOString(),
      );
      setMatches(prev => prev.map(m => m.id === updated.id ? updated : m));
    } catch (err) {
      console.error('Quarter pause failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: 'SCHEDULED' | 'LIVE' | 'DONE') => {
    if (!selectedMatchId) return;
    try {
      setLoading(true);
      const updated = await updateMatchStatus(selectedMatchId, status);
      setMatches(prev => prev.map(m => m.id === updated.id ? updated : m));
    } catch (err) {
      console.error('Status change failed:', err);
      alert('상태 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 경기 생성 폼 상태
  const [newMatch, setNewMatch] = useState<{
    sport: string;
    matchDate: string;
    timeSlot: string;
    teamAId: number;
    teamBId: number;
    category: string;
    quarterCount?: number;
    quarterMinutes?: number;
    bracketStage?: string | null;
  }>({
    sport: SPORTS[0],
    matchDate: todayYmd(),
    timeSlot: TIME_SLOTS[0].value,
    teamAId: 0,
    teamBId: 0,
    category: CATEGORIES[0],
    quarterCount: 4,
    quarterMinutes: 10,
    bracketStage: null,
  });

  const handleCreateMatch = async () => {
    if (!newMatch.teamAId || !newMatch.teamBId) {
      alert('양 팀을 선택해주세요.');
      return;
    }
    if (newMatch.teamAId === newMatch.teamBId) {
      alert('다른 팀을 선택해주세요.');
      return;
    }
    if (!newMatch.matchDate) {
      alert('날짜를 선택해주세요.');
      return;
    }
    try {
      setLoading(true);
      await createMatch({
        ...newMatch,
        bracketStage: newMatch.bracketStage ?? undefined,
        day: dayLabelFromDate(newMatch.matchDate),
      });
      setNewMatch({
        sport: SPORTS[0],
        matchDate: todayYmd(),
        timeSlot: TIME_SLOTS[0].value,
        teamAId: 0,
        teamBId: 0,
        category: CATEGORIES[0],
        quarterCount: 4,
        quarterMinutes: 10,
        bracketStage: null,
      });
      await loadData();
    } catch (err) {
      console.error('Match creation failed:', err);
      alert('경기 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMatch = async (id: number, data: Partial<Match>) => {
    try {
      setLoading(true);
      const updated = await updateMatch(id, data);
      setMatches(prev => prev.map(m => m.id === updated.id ? updated : m));
    } catch (err) {
      console.error('Match update failed:', err);
      alert('경기 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditResult = async (
    id: number,
    data: { scoreA: number; scoreB: number; status: 'SCHEDULED' | 'LIVE' | 'DONE' },
  ) => {
    try {
      setLoading(true);
      const updated = await updateMatch(id, data);
      setMatches(prev => prev.map(m => (m.id === updated.id ? updated : m)));
    } catch (err) {
      console.error('Result edit failed:', err);
      alert('결과 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMatch = async (id: number) => {
    try {
      await deleteMatch(id);
      setMatches(prev => prev.filter(m => m.id !== id));
      // 서버 상태와 재동기화 (websocket 갱신/경쟁 조건 대비).
      await loadData();
    } catch (err) {
      console.error('Match deletion failed:', err);
      alert('경기 삭제에 실패했습니다: ' + (err as Error).message);
    }
  };

  // 팀 생성 폼 상태
  const [newTeam, setNewTeam] = useState({
    name: '',
    grade: 1,
    classNumber: 1,
  });

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim()) {
      alert('팀 이름을 입력해주세요.');
      return;
    }
    try {
      setLoading(true);
      const created = await createTeam(newTeam);
      setTeams(prev => [...prev, created]);
      setNewTeam({ name: '', grade: 1, classNumber: 1 });
    } catch (err) {
      console.error('Team creation failed:', err);
      alert('팀 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (id: number) => {
    if (!confirm('이 팀을 삭제하시겠습니까?')) return;
    try {
      await deleteTeam(id);
      setTeams(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Team deletion failed:', err);
      alert('팀 삭제에 실패했습니다.');
    }
  };

  const handleSetMatchYoutube = async (matchId: number, url: string | null) => {
    try {
      const updated = await setMatchYoutube(matchId, url);
      setMatches(prev => prev.map(m => m.id === updated.id ? updated : m));
      alert('등록되었습니다. 구독자에게 알림이 전송됩니다.');
    } catch {
      alert('등록 실패');
    }
  };

  const handleCreateTournamentMatch = async (draft: {
    sport: string;
    grade?: number;
    category?: string;
    matchDate: string;
    timeSlot: string;
    teamAId: number;
    teamBId: number;
    bracketStage: string;
  }) => {
    try {
      setLoading(true);
      const created = await createMatch({
        ...draft,
        category: draft.category ?? 'GRADE',
        day: dayLabelFromDate(draft.matchDate),
      });
      setMatches(prev => [...prev, created]);
    } catch (err) {
      console.error('Tournament match creation failed:', err);
      alert('경기 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleYoutubeMatchStatusChange = async (matchId: number) => {
    try {
      const updated = await updateMatchStatus(matchId, 'DONE');
      setMatches(prev => prev.map(m => m.id === updated.id ? updated : m));
    } catch {
      alert('종료 실패');
    }
  };

  // 정렬: matchDate 오름차순, timeSlot 오름차순.
  const sortedByDate = [...matches].sort((a, b) => {
    const da = a.matchDate ?? '9999-12-31';
    const db = b.matchDate ?? '9999-12-31';
    if (da !== db) return da.localeCompare(db);
    return (a.timeSlot ?? '').localeCompare(b.timeSlot ?? '');
  });

  return {
    // 인증
    authorized,
    tokenInput,
    setTokenInput,
    authError,
    handleLogin,
    handleLogout,
    // 데이터
    matches,
    teams,
    loading,
    sortedByDate,
    // 실시간 입력
    selectedMatchId,
    setSelectedMatchId,
    selectedMatch,
    activeSet,
    setActiveSet,
    handleScoreUpdate,
    handleUndo,
    handleStatusChange,
    handleNextQuarter,
    handlePauseQuarter,
    // 일정 관리
    newMatch,
    setNewMatch,
    handleCreateMatch,
    handleDeleteMatch,
    handleUpdateMatch,
    handleEditResult,
    // 팀 관리
    newTeam,
    setNewTeam,
    handleCreateTeam,
    handleDeleteTeam,
    // 유튜브 관리
    handleSetMatchYoutube,
    handleYoutubeMatchStatusChange,
    // 토너먼트 일정
    handleCreateTournamentMatch,
    // 데이터 새로고침
    loadData,
  };
}
