/* Standalone re-seed: wipes team/match/score_log/team_subscription/notification_record
 * tables and reinserts the canonical seed defined in src/seed/seed.service.ts.
 *
 * Usage: node scripts/reseed.js
 *
 * Safe to run while the Nest dev server is up — better-sqlite3 takes a short
 * write lock per statement.
 */
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const TODAY_KEY = (() => {
  const d = new Date().getDay();
  return ['MON', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'FRI'][d];
})();

function ensureTeamColumns() {
  const cols = db.prepare(`PRAGMA table_info(team)`).all();
  const colNames = cols.map((c) => c.name);
  const gradeCol = cols.find((c) => c.name === 'grade');
  const classCol = cols.find((c) => c.name === 'classNumber');
  const needsCategory = !colNames.includes('category');
  const needsNullable = (gradeCol && gradeCol.notnull === 1) || (classCol && classCol.notnull === 1);
  if (needsCategory && !needsNullable) {
    db.exec(`ALTER TABLE team ADD COLUMN category TEXT NOT NULL DEFAULT 'GRADE'`);
    return;
  }
  if (needsNullable || needsCategory) {
    // Rebuild team table with nullable grade/classNumber + category column.
    db.exec('PRAGMA foreign_keys = OFF');
    db.exec('DROP TABLE IF EXISTS team_new');
    db.exec(`CREATE TABLE team_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR NOT NULL,
      grade INTEGER,
      classNumber INTEGER,
      category VARCHAR NOT NULL DEFAULT 'GRADE',
      createdAt DATETIME NOT NULL DEFAULT (datetime('now'))
    )`);
    const hasCat = colNames.includes('category');
    db.exec(
      `INSERT INTO team_new (id, name, grade, classNumber, category, createdAt)
       SELECT id, name, grade, classNumber, ${hasCat ? 'category' : "'GRADE'"}, createdAt FROM team`,
    );
    db.exec('DROP TABLE team');
    db.exec('ALTER TABLE team_new RENAME TO team');
    db.exec('PRAGMA foreign_keys = ON');
  }
}

function wipe() {
  db.exec('DELETE FROM score_log');
  db.exec('DELETE FROM "match"');
  // notifications/subscriptions reference teamId; clear to avoid orphan ids
  try { db.exec('DELETE FROM notification_record'); } catch (_) {}
  try { db.exec('DELETE FROM team_subscription'); } catch (_) {}
  db.exec('DELETE FROM team');
  db.exec(`DELETE FROM sqlite_sequence WHERE name IN ('team','match','score_log')`);
}

function insertTeam(name, grade, classNumber, category) {
  const stmt = db.prepare(
    `INSERT INTO team (name, grade, classNumber, category, createdAt)
     VALUES (?, ?, ?, ?, datetime('now'))`,
  );
  const info = stmt.run(name, grade, classNumber, category);
  return { id: info.lastInsertRowid, name, grade, classNumber, category };
}

function insertMatch(m) {
  const stmt = db.prepare(
    `INSERT INTO "match"
     (sport, day, timeSlot, teamAId, teamBId, scoreA, scoreB, status, result, category, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
  );
  stmt.run(
    m.sport, m.day, m.timeSlot,
    m.teamAId, m.teamBId,
    m.scoreA ?? 0, m.scoreB ?? 0,
    m.status, m.result ?? null, m.category,
  );
}

ensureTeamColumns();

const tx = db.transaction(() => {
  wipe();

  const teams = [];
  for (let grade = 1; grade <= 3; grade++) {
    for (let cls = 1; cls <= 4; cls++) {
      teams.push(insertTeam(`${grade}학년 ${cls}반`, grade, cls, 'GRADE'));
    }
  }
  for (const letter of ['A', 'B', 'C', 'D']) {
    teams.push(insertTeam(`${letter}팀`, null, null, 'CLUB'));
  }

  const g = (gr, cls) => teams.find((t) => t.grade === gr && t.classNumber === cls);
  const c = (letter) => teams.find((t) => t.name === `${letter}팀`);

  const slotTime = (slot) =>
    slot === 'LUNCH' ? { h: 12, m: 50 } : { h: 18, m: 30 };

  const now = new Date();
  const monday = new Date(now);
  const dow = now.getDay();
  monday.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow));
  monday.setHours(0, 0, 0, 0);

  const dateOf = (day, slot) => {
    const idx = DAYS.indexOf(day);
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const t = slotTime(slot);
    d.setHours(t.h, t.m, 0, 0);
    return d;
  };

  const decideStatus = (day, slot) => {
    const target = dateOf(day, slot);
    const todayIdx = DAYS.indexOf(TODAY_KEY);
    const dayIdx = DAYS.indexOf(day);
    if (dayIdx < todayIdx) return 'DONE';
    if (dayIdx > todayIdx) return 'SCHEDULED';
    const diffMin = (now.getTime() - target.getTime()) / 60000;
    if (diffMin >= 90) return 'DONE';
    if (diffMin >= -10) return 'LIVE';
    return 'SCHEDULED';
  };

  const plans = [
    { day: 'MON', slot: 'LUNCH',  sport: 'FUTSAL',         a: g(1,1), b: g(1,2), category: 'GRADE' },
    { day: 'MON', slot: 'DINNER', sport: 'BASKETBALL',     a: c('A'), b: c('B'), category: 'CLUB'  },
    { day: 'TUE', slot: 'LUNCH',  sport: 'DODGEBALL',      a: g(2,1), b: g(2,2), category: 'GRADE' },
    { day: 'TUE', slot: 'DINNER', sport: 'SOCCER',         a: g(3,1), b: g(3,2), category: 'GRADE' },
    { day: 'WED', slot: 'LUNCH',  sport: 'BIG_VOLLEYBALL', a: g(3,3), b: g(3,4), category: 'GRADE' },
    { day: 'WED', slot: 'DINNER', sport: 'BASKETBALL',     a: c('C'), b: c('D'), category: 'CLUB'  },
    { day: 'THU', slot: 'LUNCH',  sport: 'BADMINTON',      a: g(2,3), b: g(2,4), category: 'GRADE' },
    { day: 'THU', slot: 'DINNER', sport: 'RELAY',          a: c('A'), b: c('C'), category: 'CLUB'  },
    { day: 'FRI', slot: 'LUNCH',  sport: 'JUMP_ROPE',      a: g(1,3), b: g(1,4), category: 'GRADE' },
  ];
  const scorePool = [[3,1],[2,2],[4,0],[1,2],[0,3],[2,1],[3,3],[1,0],[2,0]];

  const forcedLiveIdx = 0;
  let i = 0;
  for (const p of plans) {
    let status = decideStatus(p.day, p.slot);
    if (i === forcedLiveIdx) status = 'LIVE';
    const m = {
      sport: p.sport, day: p.day, timeSlot: p.slot,
      teamAId: p.a.id, teamBId: p.b.id,
      category: p.category, status,
    };
    if (status === 'DONE') {
      const [sa, sb] = scorePool[i % scorePool.length];
      m.scoreA = sa; m.scoreB = sb;
      m.result = sa > sb ? `${p.a.name} 승` : sb > sa ? `${p.b.name} 승` : '무승부';
    } else if (status === 'LIVE') {
      m.scoreA = 1; m.scoreB = 1;
    }
    insertMatch(m);
    i++;
  }

});

tx();

const teamCount = db.prepare('SELECT COUNT(*) AS n FROM team').get().n;
const matchCount = db.prepare('SELECT COUNT(*) AS n FROM "match"').get().n;
const byStatus = db.prepare(`SELECT status, COUNT(*) AS n FROM "match" GROUP BY status`).all();
const byCat = db.prepare(`SELECT category, COUNT(*) AS n FROM "match" GROUP BY category`).all();
console.log(`Reseed complete. Today=${TODAY_KEY}. Teams=${teamCount}. Matches=${matchCount}.`);
console.log('By status:', byStatus);
console.log('By category:', byCat);
db.close();
