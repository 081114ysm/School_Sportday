'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import styles from './admin.module.css';
import { useAdminData } from '@/hooks/admin/useAdminData';
import { effectiveStatus } from '@/components/admin/adminUtils';
import { AdminTab } from '@/components/admin/adminConstants';
import { LiveInputTab } from '@/components/admin/LiveInputTab';
import { ResultsTab } from '@/components/admin/ResultsTab';
import { ScheduleMgmtTab } from '@/components/admin/ScheduleMgmtTab';
import { TeamMgmtTab } from '@/components/admin/TeamMgmtTab';
import { YoutubeMgmtTab } from '@/components/admin/YoutubeMgmtTab';
import { SportMgmtTab } from '@/components/admin/SportMgmtTab';
import { TournamentMgmtTab } from '@/components/admin/TournamentMgmtTab';
import { PointsMgmtTab } from '@/components/admin/PointsMgmtTab';
import { deleteAllMatches, deleteLastWeekMatches } from '@/services/api';

export default function AdminPage() {
  const {
    authorized,
    tokenInput,
    setTokenInput,
    authError,
    handleLogin,
    handleLogout,
    matches,
    teams,
    loading,
    sortedByDate,
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
    newMatch,
    setNewMatch,
    handleCreateMatch,
    handleDeleteMatch,
    handleUpdateMatch,
    handleEditResult,
    newTeam,
    setNewTeam,
    handleCreateTeam,
    handleDeleteTeam,
    handleSetMatchYoutube,
    handleYoutubeMatchStatusChange,
    handleCreateTournamentMatch,
    loadData,
  } = useAdminData();

  const [activeTab, setActiveTab] = useState<AdminTab>('live-input');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sportFilter, setSportFilter] = useState<string>('');
  const [resultsStatusFilter, setResultsStatusFilter] = useState<'' | 'LIVE' | 'SCHEDULED' | 'DONE'>('');
  const [scheduleSportFilter, setScheduleSportFilter] = useState<string>('');
  const [scheduleDateFilter, setScheduleDateFilter] = useState<string>('');

  // 정렬: LIVE 우선, 이후 matchDate 오름차순, timeSlot 오름차순.
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

  const filteredMatches = sortedByDate
    .filter(m => !sportFilter || m.sport === sportFilter)
    .filter(m => !resultsStatusFilter || effectiveStatus(m) === resultsStatusFilter);

  // 일정 관리 탭은 예정·진행 중 경기만 표시하며, 종료된 경기는 숨긴다.
  const scheduleMatches = sortedByDate
    .filter(m => effectiveStatus(m) !== 'DONE')
    .filter(m => !scheduleSportFilter || m.sport === scheduleSportFilter)
    .filter(m => !scheduleDateFilter || m.matchDate === scheduleDateFilter);

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
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
              관리자 인증
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

  const TABS: { key: AdminTab; label: string }[] = [
    { key: 'live-input', label: '실시간 입력' },
    { key: 'results', label: '결과 입력' },
    { key: 'schedule-mgmt', label: '일정 관리' },
    { key: 'team-mgmt', label: '팀 관리' },
    { key: 'youtube-mgmt', label: '유튜브' },
    { key: 'sport-mgmt', label: '종목 관리' },
    { key: 'tournament-mgmt', label: '토너먼트' },
    { key: 'points-mgmt', label: '승점 관리' },
  ];

  return (
    <div className={styles.adminPage}>
      {/* 햄버거 오버레이 (모바일) */}
      {mobileMenuOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 모바일 사이드 패널 */}
      <nav className={`${styles.mobileSidePanel} ${mobileMenuOpen ? styles.mobileSidePanelOpen : ''}`}>
        <div className={styles.mobileSidePanelHeader}>
          <span className={styles.mobileSidePanelTitle}>메뉴</span>
          <button
            className={styles.mobileSidePanelClose}
            onClick={() => setMobileMenuOpen(false)}
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`${styles.mobileSideNavBtn} ${activeTab === tab.key ? styles.adminNavBtnActive : ''}`}
            onClick={() => { setActiveTab(tab.key); setMobileMenuOpen(false); }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 헤더 */}
      <header className={styles.adminHeader}>
        <div className={styles.adminLogo}>
          <div className={styles.adminLogoIcon}>A</div>
          <span className={styles.adminLogoText}>관리자</span>
        </div>
        <div className={styles.adminHeaderRight}>
          {/* 햄버거 버튼 (모바일 전용) */}
          <button
            className={`${styles.adminHomeLink} ${styles.hamburgerBtn}`}
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="메뉴"
          >
            <Menu size={18} />
          </button>
          <button
            className={styles.adminHomeLink}
            onClick={async () => {
              if (!confirm('저번주 이전 경기를 모두 삭제합니다. 이번 주 경기는 유지됩니다. 계속하시겠습니까?')) return;
              try {
                const res = await deleteLastWeekMatches();
                alert(`${res.deleted}개의 경기가 삭제되었습니다. (${res.before} 이전 경기)`);
                await loadData();
              } catch (err) {
                alert('삭제 실패: ' + (err as Error).message);
              }
            }}
            style={{ cursor: 'pointer', color: '#dc2626', borderColor: '#dc2626' }}
          >
            저번주 삭제
          </button>
          <button
            className={styles.adminHomeLink}
            onClick={handleLogout}
            style={{ cursor: 'pointer' }}
          >
            로그아웃
          </button>
          <Link href="/" className={styles.adminHomeLink}>
            ← 메인으로
          </Link>
        </div>
      </header>

      {/* 내비게이션 탭 (데스크톱) */}
      <nav className={styles.adminNav}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`${styles.adminNavBtn} ${activeTab === tab.key ? styles.adminNavBtnActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 메인 콘텐츠 */}
      <div className={styles.adminContainer}>
        {activeTab === 'live-input' && (
          <LiveInputTab
            liveAndScheduledMatches={liveAndScheduledMatches}
            selectedMatchId={selectedMatchId}
            setSelectedMatchId={setSelectedMatchId}
            selectedMatch={selectedMatch}
            activeSet={activeSet}
            setActiveSet={setActiveSet}
            loading={loading}
            onScoreUpdate={handleScoreUpdate}
            onUndo={handleUndo}
            onStatusChange={handleStatusChange}
            onNextQuarter={handleNextQuarter}
            onPauseQuarter={handlePauseQuarter}
          />
        )}

        {activeTab === 'results' && (
          <ResultsTab
            filteredMatches={filteredMatches}
            sportFilter={sportFilter}
            setSportFilter={setSportFilter}
            resultsStatusFilter={resultsStatusFilter}
            setResultsStatusFilter={setResultsStatusFilter}
            onEditResult={handleEditResult}
            onDeleteResult={handleDeleteMatch}
          />
        )}

        {activeTab === 'schedule-mgmt' && (
          <ScheduleMgmtTab
            scheduleMatches={scheduleMatches}
            matches={matches}
            teams={teams}
            loading={loading}
            newMatch={newMatch}
            setNewMatch={setNewMatch}
            onCreateMatch={handleCreateMatch}
            onDeleteMatch={handleDeleteMatch}
            onUpdateMatch={handleUpdateMatch}
            scheduleSportFilter={scheduleSportFilter}
            setScheduleSportFilter={setScheduleSportFilter}
            scheduleDateFilter={scheduleDateFilter}
            setScheduleDateFilter={setScheduleDateFilter}
          />
        )}

        {activeTab === 'team-mgmt' && (
          <TeamMgmtTab
            teams={teams}
            loading={loading}
            newTeam={newTeam}
            setNewTeam={setNewTeam}
            onCreateTeam={handleCreateTeam}
            onDeleteTeam={handleDeleteTeam}
          />
        )}

        {activeTab === 'youtube-mgmt' && (
          <YoutubeMgmtTab
            sortedByDate={sortedByDate}
            onSetMatchYoutube={handleSetMatchYoutube}
            onMatchStatusChange={handleYoutubeMatchStatusChange}
          />
        )}

        {activeTab === 'sport-mgmt' && <SportMgmtTab />}

        {activeTab === 'tournament-mgmt' && (
          <TournamentMgmtTab
            matches={matches}
            teams={teams}
            loading={loading}
            onCreateTournamentMatch={handleCreateTournamentMatch}
            onDeleteMatch={handleDeleteMatch}
          />
        )}

        {activeTab === 'points-mgmt' && (
          <PointsMgmtTab
            teams={teams}
            onRefresh={loadData}
          />
        )}
      </div>
    </div>
  );
}
