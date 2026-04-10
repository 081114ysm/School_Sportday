'use client';

import type { Match } from '@/types';
import { formatMatchScore, getMatchScorePair } from '@/lib/matchScore';
import styles from './Bracket.module.css';

interface BracketProps {
  title: string;
  sport: string;
  grade: number;
  matches: Match[];
}

type Winner = 'A' | 'B' | null;

function matchWinner(m: Match | undefined): Winner {
  if (!m || m.status !== 'DONE') return null;
  const { a, b } = getMatchScorePair(m);
  if (a > b) return 'A';
  if (b > a) return 'B';
  return null;
}

function winningTeamName(m: Match | undefined): string | null {
  const w = matchWinner(m);
  if (!w || !m) return null;
  return (w === 'A' ? m.teamA?.name : m.teamB?.name) ?? null;
}

export default function Bracket({ title, sport, grade, matches }: BracketProps) {
  const pool = matches.filter(
    (m) =>
      m.sport === sport &&
      m.category === 'GRADE' &&
      (m.teamA?.grade === grade || m.teamB?.grade === grade),
  );
  const semi1 = pool.find((m) => m.bracketStage === 'SEMI1');
  const semi2 = pool.find((m) => m.bracketStage === 'SEMI2');
  const final = pool.find((m) => m.bracketStage === 'FINAL');

  const semi1Winner = matchWinner(semi1);
  const semi2Winner = matchWinner(semi2);
  const semi1WinnerName = winningTeamName(semi1);
  const semi2WinnerName = winningTeamName(semi2);
  const champion = winningTeamName(final);

  return (
    <section className={styles.wrap}>
      <h2 className={styles.title}>
        {title}
        <span className={styles.titleBadge}>토너먼트</span>
      </h2>
      <div className={styles.grid}>
        {/* Desktop: semis column */}
        <div className={styles.semis}>
          <MatchCard match={semi1} stageLabel="준결승 1" />
          {/* Mobile vertical connector between semi1 and semi2 */}
          <div
            className={`${styles.mobileConnector} ${
              semi1Winner ? styles.green : ''
            }`}
          />
          <MatchCard match={semi2} stageLabel="준결승 2" />
        </div>
        {/* Desktop bracket connector */}
        <div
          className={`${styles.connector} ${
            semi1Winner ? styles.topGreen : ''
          } ${semi2Winner ? styles.botGreen : ''}`}
        >
          <div className={styles.vbar} />
          <div className={styles.out} />
        </div>
        {/* Mobile vertical connector between semis and final */}
        <div
          className={`${styles.mobileConnector} ${
            semi1Winner && semi2Winner ? styles.green : ''
          }`}
        />
        <div className={styles.finalCol}>
          <MatchCard
            match={final}
            stageLabel="결승"
            teamAName={semi1WinnerName ?? undefined}
            teamBName={semi2WinnerName ?? undefined}
          />
        </div>
        {/* Desktop connector final → champion */}
        <div
          className={`${styles.connectorFinal} ${champion ? styles.green : ''}`}
        />
        {/* Mobile vertical connector between final and champion */}
        <div
          className={`${styles.mobileConnector} ${champion ? styles.green : ''}`}
        />
        <div className={styles.championCol}>
          {champion ? (
            <div className={styles.champion}>
              <div className={styles.championTrophy}>🏆</div>
              <div className={styles.championLabel}>CHAMPION</div>
              <div className={styles.championName}>{champion}</div>
            </div>
          ) : (
            <div className={styles.championPlaceholder}>우승팀 대기</div>
          )}
        </div>
      </div>
    </section>
  );
}

function MatchCard({
  match,
  stageLabel,
  teamAName,
  teamBName,
}: {
  match: Match | undefined;
  stageLabel: string;
  teamAName?: string;
  teamBName?: string;
}) {
  if (!match) {
    return (
      <div className={styles.card}>
        <div className={styles.cardStage}>{stageLabel}</div>
        <div className={styles.row}>
          <span className={`${styles.teamName} ${teamAName ? '' : styles.tbd}`}>
            {teamAName ?? '미정'}
          </span>
          <span className={`${styles.score} ${styles.loser}`}>-</span>
        </div>
        <div className={styles.row}>
          <span className={`${styles.teamName} ${teamBName ? '' : styles.tbd}`}>
            {teamBName ?? '미정'}
          </span>
          <span className={`${styles.score} ${styles.loser}`}>-</span>
        </div>
      </div>
    );
  }
  const winner = matchWinner(match);
  const scorePair = getMatchScorePair(match);
  const done = match.status === 'DONE';
  const aLoser = done && winner === 'B';
  const bLoser = done && winner === 'A';
  const scoreText = done ? formatMatchScore(match) : `${scorePair.a}:${scorePair.b}`;
  const [aScore, bScore] = scoreText.split(':');
  return (
    <div className={styles.card}>
      <div className={styles.cardStage}>{stageLabel}</div>
      <div className={styles.row}>
        <span className={`${styles.teamName} ${aLoser ? styles.loser : ''}`}>
          {match.teamA?.name ?? teamAName ?? '미정'}
        </span>
        <span className={`${styles.score} ${aLoser ? styles.loser : ''}`}>
          {aScore}
        </span>
      </div>
      <div className={styles.row}>
        <span className={`${styles.teamName} ${bLoser ? styles.loser : ''}`}>
          {match.teamB?.name ?? teamBName ?? '미정'}
        </span>
        <span className={`${styles.score} ${bLoser ? styles.loser : ''}`}>
          {bScore}
        </span>
      </div>
    </div>
  );
}
