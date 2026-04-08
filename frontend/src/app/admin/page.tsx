'use client';

import { useEffect, useState, useCallback } from 'react';
import styles from './admin.module.css';
import Link from 'next/link';
import { Match, Team } from '@/lib/types';
import { getAdminToken, setAdminToken, clearAdminToken } from '@/lib/admin';
import {
  fetchMatches,
  fetchTeams,
  createMatch,
  deleteMatch,
  createTeam,
  deleteTeam,
  updateScore,
  updateSetScore,
  updateMatchStatus,
  undoScore,
  setMatchYoutube,
  verifyAdminToken,
} from '@/lib/api';
import { getSocket, disconnectSocket } from '@/lib/socket';

type AdminTab = 'live-input' | 'results' | 'schedule-mgmt' | 'team-mgmt' | 'youtube-mgmt';

const SPORTS = [
  '농구',
  '탁구',
  '피구',
  '빅발리볼',
  '줄다리기',
  '단체 줄넘기',
  '축구',
  '배드민턴',
  '이어달리기',
];

// 종목별 출전 가능 팀 규칙. grades가 비어 있으면 전 학년 허용,
// allowClub이 true면 연합(CLUB) 팀도 선택 가능.
type SportRule = { grades?: number[]; allowClub?: boolean };
const SPORT_RULES: Record<string, SportRule> = {
  '농구':        { grades: [3], allowClub: true },   // 3학년 / 남자연합
  '탁구':        { grades: [3] },                    // 3학년 전용
  '피구':        { allowClub: true },                // 학년별 전원 + 여자연합
  '빅발리볼':    { grades: [1], allowClub: true },   // 1학년 / 남자·여자연합
  '줄다리기':    {},                                 // 학년별 전원
  '단체 줄넘기': {},                                 // 학년별 전원
  '축구':        { allowClub: true },                // 남자연합
  '배드민턴':    { allowClub: true },                // 전체연합
  '이어달리기':  { allowClub: true },                // 전체연합
};

function filterTeamsForSport(teams: Team[], sport: string): Team[] {
  const rule = SPORT_RULES[sport] ?? {};
  const hasGradeFilter = Array.isArray(rule.grades) && rule.grades.length > 0;
  return teams.filter(t => {
    const isClub = t.category === 'CLUB' || t.grade == null;
    if (isClub) return rule.allowClub === true;
    if (!hasGradeFilter) return true;
    return rule.grades!.includes(t.grade as number);
  });
}
function sportRestrictionLabel(sport: string): string {
  const rule = SPORT_RULES[sport] ?? {};
  const parts: string[] = [];
  if (rule.grades?.length) parts.push(rule.grades.map(g => `${g}학년`).join('·'));
  if (rule.allowClub) parts.push('연합');
  return parts.join(' / ');
}
const TIME_SLOTS = [
  { value: 'LUNCH', label: '점심 (12:50)' },
  { value: 'DINNER', label: '저녁 (18:30)' },
] as const;
function slotLabel(slot: string): string {
  if (slot === 'LUNCH') return '점심 12:50';
  if (slot === 'DINNER') return '저녁 18:30';
  return slot;
}

// Sports that use a 3-set scoreboard instead of a single score.
const MULTI_SET_SPORTS = new Set(['빅발리볼']);
function isMultiSet(sport: string): boolean {
  return MULTI_SET_SPORTS.has(sport);
}
function parseSets(setsJson: string | null | undefined): Array<{ a: number; b: number }> {
  let arr: Array<{ a: number; b: number }> = [];
  if (setsJson) {
    try {
      const parsed = JSON.parse(setsJson);
      if (Array.isArray(parsed)) arr = parsed;
    } catch {
      /* ignore */
    }
  }
  while (arr.length < 3) arr.push({ a: 0, b: 0 });
  return arr.slice(0, 3);
}
const CATEGORIES = ['예선', '본선', '결승', '3/4위전'];

function todayYmd(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const KO_DOW = ['일', '월', '화', '수', '목', '금', '토'];
function dayLabelFromDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return KO_DOW[new Date(y, m - 1, d).getDay()];
}

// LIVE wins; otherwise compare matchDate to today. No matchDate => keep stored.
function effectiveStatus(match: Match): 'LIVE' | 'DONE' | 'SCHEDULED' {
  if (match.status === 'LIVE') return 'LIVE';
  if (!match.matchDate) return (match.status as 'DONE' | 'SCHEDULED') ?? 'SCHEDULED';
  const today = todayYmd();
  if (match.matchDate < today) return 'DONE';
  if (match.matchDate > today) return 'SCHEDULED';
  return (match.status as 'DONE' | 'SCHEDULED') ?? 'SCHEDULED';
}

export default function AdminPage() {
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

  const [activeTab, setActiveTab] = useState<AdminTab>('live-input');
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [activeSet, setActiveSet] = useState<number>(0); // volleyball 3-set
  const [sportFilter, setSportFilter] = useState<string>('');
  const [resultsStatusFilter, setResultsStatusFilter] = useState<'' | 'LIVE' | 'SCHEDULED' | 'DONE'>('');
  const [scheduleSportFilter, setScheduleSportFilter] = useState<string>('');
  const [scheduleDateFilter, setScheduleDateFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Match creation form state
  const [newMatch, setNewMatch] = useState<{
    sport: string;
    matchDate: string;
    timeSlot: string;
    teamAId: number;
    teamBId: number;
    category: string;
  }>({
    sport: SPORTS[0],
    matchDate: todayYmd(),
    timeSlot: TIME_SLOTS[0].value,
    teamAId: 0,
    teamBId: 0,
    category: CATEGORIES[0],
  });

  // Team creation form state
  const [newTeam, setNewTeam] = useState({
    name: '',
    grade: 1,
    classNumber: 1,
  });

  const loadData = useCallback(async () => {
    try {
      const [matchData, teamData] = await Promise.all([
        fetchMatches().catch(() => []),
        fetchTeams().catch(() => []),
      ]);
      setTeams(teamData);

      // Auto-sync stored status to date-derived status: matches in the past
      // become DONE, future matches become SCHEDULED. LIVE is preserved.
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

  const selectedMatch = matches.find(m => m.id === selectedMatchId) || null;

  // For volleyball: auto-advance the active set indicator to the first
  // unfinished set whenever the selected match's score updates. A set is
  // "finished" once a side reaches 25.
  useEffect(() => {
    if (!selectedMatch || !isMultiSet(selectedMatch.sport)) return;
    const sets = parseSets(selectedMatch.setsJson);
    const SET_TARGET = 25;
    const idx = sets.findIndex(s => !(s.a >= SET_TARGET || s.b >= SET_TARGET));
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

  const handleCreateMatch = async () => {
    if (!newMatch.teamAId || !newMatch.teamBId) {
      alert('양 팀을 선택해주세요.');
      return;
    }
    if (newMatch.teamAId === newMatch.teamBId) {
      alert('다른 팀을 선택해주세요.');
      return;
    }
    try {
      setLoading(true);
      const created = await createMatch({
        ...newMatch,
        day: dayLabelFromDate(newMatch.matchDate),
      });
      setMatches(prev => [...prev, created]);
      setNewMatch({
        sport: SPORTS[0],
        matchDate: todayYmd(),
        timeSlot: TIME_SLOTS[0].value,
        teamAId: 0,
        teamBId: 0,
        category: CATEGORIES[0],
      });
    } catch (err) {
      console.error('Match creation failed:', err);
      alert('경기 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMatch = async (id: number) => {
    if (!confirm('이 경기를 삭제하시겠습니까?')) return;
    try {
      await deleteMatch(id);
      setMatches(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Match deletion failed:', err);
      alert('경기 삭제에 실패했습니다.');
    }
  };

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

  // Sort: LIVE first, then by matchDate asc, then timeSlot asc.
  const sortedByDate = [...matches].sort((a, b) => {
    const da = a.matchDate ?? '9999-12-31';
    const db = b.matchDate ?? '9999-12-31';
    if (da !== db) return da.localeCompare(db);
    return (a.timeSlot ?? '').localeCompare(b.timeSlot ?? '');
  });

  const filteredMatches = sortedByDate
    .filter(m => !sportFilter || m.sport === sportFilter)
    .filter(m => !resultsStatusFilter || effectiveStatus(m) === resultsStatusFilter);

  // Schedule mgmt only shows upcoming/live matches; finished ones are hidden.
  const scheduleMatches = sortedByDate
    .filter(m => effectiveStatus(m) !== 'DONE')
    .filter(m => !scheduleSportFilter || m.sport === scheduleSportFilter)
    .filter(m => !scheduleDateFilter || m.matchDate === scheduleDateFilter);

  const liveAndScheduledMatches = sortedByDate
    .filter(m => {
      const eff = effectiveStatus(m);
      return eff === 'LIVE' || eff === 'SCHEDULED';
    })
    .sort((a, b) => {
      // LIVE first
      const la = effectiveStatus(a) === 'LIVE' ? 0 : 1;
      const lb = effectiveStatus(b) === 'LIVE' ? 0 : 1;
      if (la !== lb) return la - lb;
      return 0;
    });

  const StatusBadge = ({ match }: { match: Match }) => {
    const eff = effectiveStatus(match);
    const cls =
      eff === 'LIVE' ? styles.resultBadgeLive :
      eff === 'DONE' ? styles.resultBadgeDone :
      styles.resultBadgeScheduled;
    const text = eff === 'LIVE' ? 'LIVE' : eff === 'DONE' ? '종료' : '예정';
    return <span className={`${styles.resultBadge} ${cls}`}>{text}</span>;
  };

  if (!authorized) {
    return (
      <div className={styles.adminPage}>
        <header className={styles.adminHeader}>
          <div className={styles.adminLogo}>
            <div className={styles.adminLogoIcon}>{'\u2699'}</div>
            <span className={styles.adminLogoText}>ADMIN PANEL</span>
          </div>
          <Link href="/" className={styles.adminHomeLink}>
            {'\u2190'} 메인으로
          </Link>
        </header>
        <div className={styles.adminContainer}>
          <div
            style={{
              maxWidth: 420,
              margin: '60px auto',
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: 28,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>
              🔒 관리자 인증
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
              관리자 비밀번호를 입력하세요. 한 번 입력하면 이 기기에서 기억됩니다.
            </p>
            <input
              className={styles.formInput}
              type="password"
              placeholder="비밀번호"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLogin();
              }}
              style={{ width: '100%', marginBottom: 12 }}
              autoFocus
            />
            {authError && (
              <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>
                {authError}
              </div>
            )}
            <button
              className={styles.formSubmitBtn}
              onClick={handleLogin}
              style={{ width: '100%' }}
            >
              로그인
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminPage}>
      {/* HEADER */}
      <header className={styles.adminHeader}>
        <div className={styles.adminLogo}>
          <div className={styles.adminLogoIcon}>{'\u2699'}</div>
          <span className={styles.adminLogoText}>ADMIN PANEL</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className={styles.adminHomeLink}
            onClick={handleLogout}
            style={{ cursor: 'pointer' }}
          >
            🔓 로그아웃
          </button>
          <Link href="/" className={styles.adminHomeLink}>
            {'\u2190'} 메인으로
          </Link>
        </div>
      </header>

      {/* NAV TABS */}
      <nav className={styles.adminNav}>
        {([
          { key: 'live-input' as AdminTab, label: '\uD83C\uDFAE 실시간 입력' },
          { key: 'results' as AdminTab, label: '\uD83D\uDCCB 결과 입력' },
          { key: 'schedule-mgmt' as AdminTab, label: '\uD83D\uDCC5 일정 관리' },
          { key: 'team-mgmt' as AdminTab, label: '\uD83D\uDC65 팀 관리' },
          { key: 'youtube-mgmt' as AdminTab, label: '\uD83D\uDCFA 유튜브 관리' },
        ]).map(tab => (
          <button
            key={tab.key}
            className={`${styles.adminNavBtn} ${activeTab === tab.key ? styles.adminNavBtnActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* MAIN CONTENT */}
      <div className={styles.adminContainer}>

        {/* LIVE INPUT TAB */}
        {activeTab === 'live-input' && (
          <div>
            <h2 className={styles.adminSectionTitle}>{'\uD83C\uDFAE'} 실시간 점수 입력</h2>
            <select
              className={styles.matchSelector}
              value={selectedMatchId ?? ''}
              onChange={e => setSelectedMatchId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">경기를 선택하세요</option>
              {liveAndScheduledMatches.map(match => (
                <option key={match.id} value={match.id}>
                  [{effectiveStatus(match) === 'LIVE' ? '🔴 LIVE' : '⏳ 예정'}] {match.sport} · {match.teamA?.name || 'Team A'} vs {match.teamB?.name || 'Team B'} · {match.matchDate ?? '날짜미정'} {slotLabel(match.timeSlot)}
                </option>
              ))}
            </select>

            {selectedMatch ? (
              <div className={styles.scoreBoard}>
                <div className={styles.scoreBoardHeader}>
                  <div className={styles.scoreBoardSport}>{selectedMatch.sport} - {selectedMatch.category}</div>
                  <div className={styles.scoreBoardStatus}>
                    {(() => {
                      const eff = effectiveStatus(selectedMatch);
                      return eff === 'LIVE' ? '\uD83D\uDD34 진행 중' :
                             eff === 'DONE' ? '\u2705 종료' : '\u23F3 예정';
                    })()}
                  </div>
                </div>

                {isMultiSet(selectedMatch.sport) && (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
                    {parseSets(selectedMatch.setsJson).map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveSet(i)}
                        className={`${styles.filterBtn} ${activeSet === i ? styles.filterBtnActive : ''}`}
                        style={{ minWidth: 110 }}
                      >
                        {i + 1}세트 &nbsp; <strong>{s.a} : {s.b}</strong>
                      </button>
                    ))}
                  </div>
                )}

                <div className={styles.scoreArea}>
                  <div className={styles.scoreTeam}>
                    <div className={styles.scoreTeamName}>{selectedMatch.teamA?.name || 'Team A'}</div>
                    <div className={styles.scoreNum}>
                      {isMultiSet(selectedMatch.sport)
                        ? parseSets(selectedMatch.setsJson)[activeSet].a
                        : selectedMatch.scoreA}
                    </div>
                    <div className={styles.scoreButtons}>
                      <button
                        className={styles.scoreBtnPlus}
                        onClick={() => handleScoreUpdate('A', 1)}
                        disabled={loading || selectedMatch.status !== 'LIVE'}
                      >
                        +
                      </button>
                      <button
                        className={styles.scoreBtnMinus}
                        onClick={() => handleScoreUpdate('A', -1)}
                        disabled={loading || selectedMatch.status !== 'LIVE' || selectedMatch.scoreA <= 0}
                      >
                        -
                      </button>
                    </div>
                  </div>

                  <div className={styles.scoreVs}>VS</div>

                  <div className={styles.scoreTeam}>
                    <div className={styles.scoreTeamName}>{selectedMatch.teamB?.name || 'Team B'}</div>
                    <div className={styles.scoreNum}>
                      {isMultiSet(selectedMatch.sport)
                        ? parseSets(selectedMatch.setsJson)[activeSet].b
                        : selectedMatch.scoreB}
                    </div>
                    <div className={styles.scoreButtons}>
                      <button
                        className={styles.scoreBtnPlus}
                        onClick={() => handleScoreUpdate('B', 1)}
                        disabled={loading || selectedMatch.status !== 'LIVE'}
                      >
                        +
                      </button>
                      <button
                        className={styles.scoreBtnMinus}
                        onClick={() => handleScoreUpdate('B', -1)}
                        disabled={loading || selectedMatch.status !== 'LIVE' || selectedMatch.scoreB <= 0}
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.actionRow}>
                  <button
                    className={`${styles.actionBtn} ${styles.btnUndo}`}
                    onClick={handleUndo}
                    disabled={loading || selectedMatch.status !== 'LIVE'}
                  >
                    {'\u21A9'} 실행 취소
                  </button>
                  {selectedMatch.status === 'SCHEDULED' && (
                    <button
                      className={`${styles.actionBtn} ${styles.btnStart}`}
                      onClick={() => handleStatusChange('LIVE')}
                      disabled={loading}
                    >
                      {'\u25B6'} 경기 시작
                    </button>
                  )}
                  {selectedMatch.status === 'LIVE' && (
                    <button
                      className={`${styles.actionBtn} ${styles.btnEnd}`}
                      onClick={() => handleStatusChange('DONE')}
                      disabled={loading}
                    >
                      {'\u23F9'} 경기 종료
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.noData}>
                경기를 선택해주세요
              </div>
            )}
          </div>
        )}

        {/* RESULTS TAB */}
        {activeTab === 'results' && (
          <div>
            <h2 className={styles.adminSectionTitle}>{'\uD83D\uDCCB'} 경기 결과</h2>
            <div className={styles.filterRow}>
              <button
                className={`${styles.filterBtn} ${sportFilter === '' ? styles.filterBtnActive : ''}`}
                onClick={() => setSportFilter('')}
              >
                전체 종목
              </button>
              {SPORTS.map(sport => (
                <button
                  key={sport}
                  className={`${styles.filterBtn} ${sportFilter === sport ? styles.filterBtnActive : ''}`}
                  onClick={() => setSportFilter(sport)}
                >
                  {sport}
                </button>
              ))}
            </div>
            <div className={styles.filterRow}>
              {([
                { v: '', label: '전체 상태' },
                { v: 'LIVE', label: 'LIVE' },
                { v: 'SCHEDULED', label: '예정' },
                { v: 'DONE', label: '종료' },
              ] as const).map(opt => (
                <button
                  key={opt.v}
                  className={`${styles.filterBtn} ${resultsStatusFilter === opt.v ? styles.filterBtnActive : ''}`}
                  onClick={() => setResultsStatusFilter(opt.v)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {filteredMatches.length === 0 ? (
              <div className={styles.noData}>경기 데이터가 없습니다</div>
            ) : (
              <div className={styles.resultCards}>
                {filteredMatches.map(match => {
                  const eff = effectiveStatus(match);
                  return (
                  <div key={match.id} className={styles.resultCard}>
                    <div className={styles.resultCardHeader}>
                      <span className={styles.resultSport}>{match.sport}</span>
                      <span className={`${styles.resultBadge} ${
                        eff === 'LIVE' ? styles.resultBadgeLive :
                        eff === 'DONE' ? styles.resultBadgeDone :
                        styles.resultBadgeScheduled
                      }`}>
                        {eff === 'LIVE' ? 'LIVE' :
                         eff === 'DONE' ? '종료' : '예정'}
                      </span>
                    </div>
                    <div className={styles.resultScoreRow}>
                      <span className={styles.resultTeamName}>
                        {match.teamA?.name || 'Team A'}
                      </span>
                      <span className={styles.resultScore}>{match.scoreA}</span>
                      <span className={styles.resultDash}>:</span>
                      <span className={styles.resultScore}>{match.scoreB}</span>
                      <span className={`${styles.resultTeamName} ${styles.resultTeamNameRight}`}>
                        {match.teamB?.name || 'Team B'}
                      </span>
                    </div>
                    <div className={styles.resultMeta}>
                      {match.matchDate ?? '날짜미정'} ({match.day}) {slotLabel(match.timeSlot)} | {match.category}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SCHEDULE MANAGEMENT TAB */}
        {activeTab === 'schedule-mgmt' && (
          <div>
            <h2 className={styles.adminSectionTitle}>{'\uD83D\uDCC5'} 일정 관리</h2>

            {/* Creation Form */}
            <div className={styles.formCard}>
              <div className={styles.formTitle}>새 경기 추가</div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>종목</label>
                  <select
                    className={styles.formSelect}
                    value={newMatch.sport}
                    onChange={e =>
                      setNewMatch(prev => ({
                        ...prev,
                        sport: e.target.value,
                        // 종목이 바뀌면 학년 제한이 달라질 수 있으므로 팀 선택 리셋
                        teamAId: 0,
                        teamBId: 0,
                      }))
                    }
                  >
                    {SPORTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>날짜</label>
                  <input
                    className={styles.formInput}
                    type="date"
                    value={newMatch.matchDate}
                    onChange={e => setNewMatch(prev => ({ ...prev, matchDate: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>시간</label>
                  <select
                    className={styles.formSelect}
                    value={newMatch.timeSlot}
                    onChange={e => setNewMatch(prev => ({ ...prev, timeSlot: e.target.value }))}
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>카테고리</label>
                  <select
                    className={styles.formSelect}
                    value={newMatch.category}
                    onChange={e => setNewMatch(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {(() => {
                  const selectable = filterTeamsForSport(teams, newMatch.sport);
                  const label = sportRestrictionLabel(newMatch.sport);
                  const suffix = label ? ` (${label})` : '';
                  const renderOption = (t: Team) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.grade != null ? ` (${t.grade}-${t.classNumber})` : ' (연합)'}
                    </option>
                  );
                  return (
                    <>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>팀 A{suffix}</label>
                        <select
                          className={styles.formSelect}
                          value={newMatch.teamAId}
                          onChange={e => setNewMatch(prev => ({ ...prev, teamAId: Number(e.target.value) }))}
                        >
                          <option value={0}>팀 선택</option>
                          {selectable.map(renderOption)}
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>팀 B{suffix}</label>
                        <select
                          className={styles.formSelect}
                          value={newMatch.teamBId}
                          onChange={e => setNewMatch(prev => ({ ...prev, teamBId: Number(e.target.value) }))}
                        >
                          <option value={0}>팀 선택</option>
                          {selectable.map(renderOption)}
                        </select>
                      </div>
                    </>
                  );
                })()}
              </div>
              <button
                className={styles.formSubmitBtn}
                onClick={handleCreateMatch}
                disabled={loading}
              >
                {loading ? '생성 중...' : '+ 경기 추가'}
              </button>
            </div>

            {/* Filters */}
            <div className={styles.filterRow}>
              <button
                className={`${styles.filterBtn} ${scheduleSportFilter === '' ? styles.filterBtnActive : ''}`}
                onClick={() => setScheduleSportFilter('')}
              >
                전체 종목
              </button>
              {SPORTS.map(s => (
                <button
                  key={s}
                  className={`${styles.filterBtn} ${scheduleSportFilter === s ? styles.filterBtnActive : ''}`}
                  onClick={() => setScheduleSportFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className={styles.filterRow}>
              <input
                className={styles.formInput}
                type="date"
                value={scheduleDateFilter}
                onChange={e => setScheduleDateFilter(e.target.value)}
                style={{ maxWidth: 180 }}
              />
              {scheduleDateFilter && (
                <button
                  className={styles.filterBtn}
                  onClick={() => setScheduleDateFilter('')}
                >
                  날짜 초기화
                </button>
              )}
            </div>

            {/* Match List grouped by date */}
            <div className={styles.formTitle}>
              등록된 경기 ({scheduleMatches.length}{scheduleMatches.length !== matches.length ? ` / ${matches.length}` : ''})
            </div>
            <div className={styles.matchList}>
              {scheduleMatches.length === 0 ? (
                <div className={styles.noData}>표시할 경기가 없습니다</div>
              ) : (
                (['LIVE', 'SCHEDULED'] as const).map(group => {
                  const items = scheduleMatches.filter(m => effectiveStatus(m) === group);
                  if (items.length === 0) return null;
                  const label = group === 'LIVE' ? '🔴 진행 중' : '⏳ 예정';
                  return (
                  <div key={group} className={styles.dateGroup}>
                    <div className={styles.dateGroupHeader}>
                      {label} · {items.length}경기
                    </div>
                    {items.map(match => (
                      <div key={match.id} className={styles.matchListItem}>
                        <div className={styles.matchListLeft}>
                          <StatusBadge match={match} />
                          <span className={styles.matchListSport}>{match.sport}</span>
                          <span className={styles.matchListTeams}>
                            {match.teamA?.name || 'Team A'} vs {match.teamB?.name || 'Team B'}
                          </span>
                          <span className={styles.matchListTime}>
                            {match.matchDate ?? '날짜미정'} · {slotLabel(match.timeSlot)} · {match.category}
                          </span>
                        </div>
                        <div className={styles.matchListActions}>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteMatch(match.id)}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* YOUTUBE MANAGEMENT TAB */}
        {activeTab === 'youtube-mgmt' && (
          <div>
            <h2 className={styles.adminSectionTitle}>{'\uD83D\uDCFA'} 유튜브 라이브 관리</h2>
            <div className={styles.matchList}>
              {sortedByDate.length === 0 ? (
                <div className={styles.noData}>등록된 경기가 없습니다</div>
              ) : (
                (['LIVE', 'SCHEDULED', 'DONE'] as const).map(group => {
                  const items = sortedByDate.filter(m => effectiveStatus(m) === group);
                  if (items.length === 0) return null;
                  const label = group === 'LIVE' ? '🔴 진행 중' : group === 'SCHEDULED' ? '⏳ 예정' : '✅ 종료';
                  return (
                    <div key={group} className={styles.dateGroup}>
                      <div className={styles.dateGroupHeader}>{label} · {items.length}경기</div>
                      {items.map(match => (
                  <div key={match.id} className={styles.matchListItem}>
                    <div className={styles.matchListLeft}>
                      <StatusBadge match={match} />
                      <span className={styles.matchListSport}>{match.sport}</span>
                      <span className={styles.matchListTeams}>
                        {match.teamA?.name || 'Team A'} vs {match.teamB?.name || 'Team B'}
                      </span>
                      <span className={styles.matchListTime}>
                        {match.matchDate ?? '날짜미정'} {slotLabel(match.timeSlot)}
                      </span>
                    </div>
                    <div className={styles.matchListActions} style={{ gap: 6 }}>
                      <input
                        className={styles.formInput}
                        type="text"
                        defaultValue={match.youtubeUrl ?? ''}
                        placeholder="YouTube URL"
                        style={{ minWidth: 220 }}
                        id={`yt-${match.id}`}
                      />
                      <button
                        className={styles.formSubmitBtn}
                        style={{ padding: '8px 14px', fontSize: 12 }}
                        onClick={async () => {
                          const el = document.getElementById(`yt-${match.id}`) as HTMLInputElement | null;
                          const url = el?.value.trim() || null;
                          try {
                            const updated = await setMatchYoutube(match.id, url);
                            setMatches(prev => prev.map(m => m.id === updated.id ? updated : m));
                            alert('등록되었습니다. 구독자에게 알림이 전송됩니다.');
                          } catch {
                            alert('등록 실패');
                          }
                        }}
                      >
                        등록 / 라이브
                      </button>
                      {match.status !== 'DONE' && (
                        <button
                          className={`${styles.actionBtn} ${styles.btnEnd}`}
                          style={{ padding: '8px 14px', fontSize: 12 }}
                          onClick={async () => {
                            try {
                              const updated = await updateMatchStatus(match.id, 'DONE');
                              setMatches(prev => prev.map(m => m.id === updated.id ? updated : m));
                            } catch {
                              alert('종료 실패');
                            }
                          }}
                        >
                          경기 종료
                        </button>
                      )}
                    </div>
                  </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TEAM MANAGEMENT TAB */}
        {activeTab === 'team-mgmt' && (
          <div>
            <h2 className={styles.adminSectionTitle}>{'\uD83D\uDC65'} 팀 관리</h2>

            {/* Team Creation Form */}
            <div className={styles.teamFormCard}>
              <div className={styles.formTitle}>새 팀 추가</div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>팀 이름</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    placeholder="팀 이름 입력"
                    value={newTeam.name}
                    onChange={e => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>학년</label>
                  <select
                    className={styles.formSelect}
                    value={newTeam.grade}
                    onChange={e => setNewTeam(prev => ({ ...prev, grade: Number(e.target.value) }))}
                  >
                    <option value={1}>1학년</option>
                    <option value={2}>2학년</option>
                    <option value={3}>3학년</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>반</label>
                  <select
                    className={styles.formSelect}
                    value={newTeam.classNumber}
                    onChange={e => setNewTeam(prev => ({ ...prev, classNumber: Number(e.target.value) }))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>{n}반</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                className={styles.formSubmitBtn}
                onClick={handleCreateTeam}
                disabled={loading}
              >
                {loading ? '생성 중...' : '+ 팀 추가'}
              </button>
            </div>

            {/* Team List */}
            <div className={styles.formTitle}>등록된 팀 ({teams.length})</div>
            {teams.length === 0 ? (
              <div className={styles.noData}>등록된 팀이 없습니다</div>
            ) : (
              <div className={styles.teamList}>
                {teams.map(team => (
                  <div key={team.id} className={styles.teamListItem}>
                    <div className={styles.teamListInfo}>
                      <div className={styles.teamListAvatar}>
                        {team.name.charAt(0)}
                      </div>
                      <div>
                        <div className={styles.teamListName}>{team.name}</div>
                        <div className={styles.teamListGrade}>{team.grade}학년 {team.classNumber}반</div>
                      </div>
                    </div>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteTeam(team.id)}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
