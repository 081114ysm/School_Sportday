import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

plt.rcParams['font.family'] = 'Malgun Gothic'
plt.rcParams['axes.unicode_minus'] = False

fig = plt.figure(figsize=(28, 20), facecolor='#0f172a')
ax = fig.add_axes([0, 0, 1, 1])
ax.set_xlim(0, 28)
ax.set_ylim(0, 20)
ax.axis('off')
ax.set_facecolor('#0f172a')

C = {
    'client':     '#1d4ed8',
    'client_b':   '#3b82f6',
    'frontend':   '#0f766e',
    'frontend_b': '#14b8a6',
    'backend':    '#7c3aed',
    'backend_b':  '#a78bfa',
    'db':         '#b45309',
    'db_b':       '#fbbf24',
    'ext_b':      '#f472b6',
    'ws_b':       '#34d399',
    'text':       '#f1f5f9',
    'subtext':    '#94a3b8',
    'arrow_ws':   '#34d399',
    'arrow_push': '#f472b6',
    'arrow_http': '#60a5fa',
    'label':      '#e2e8f0',
}


def box(axis, x, y, w, h, fill, border, radius=0.3, alpha=0.92):
    p = FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=0,rounding_size=" + str(radius),
        facecolor=fill, edgecolor=border,
        linewidth=1.5, alpha=alpha, zorder=3
    )
    axis.add_patch(p)


def header(axis, x, y, w, h, fill, border, title):
    box(axis, x, y, w, h, fill, border)
    axis.text(x + w / 2, y + h - 0.4, title, color=C['text'],
              fontsize=9, fontweight='bold', ha='center', va='center', zorder=5)


def item(axis, x, y, w, h, color, label, sublabel=''):
    box(axis, x, y, w, h, color + '22', color, radius=0.2)
    ty = y + h / 2 + (0.12 if sublabel else 0)
    axis.text(x + w / 2, ty, label, color=C['label'],
              fontsize=7.5, fontweight='bold', ha='center', va='center', zorder=5)
    if sublabel:
        axis.text(x + w / 2, y + h / 2 - 0.17, sublabel,
                  color=C['subtext'], fontsize=6.3, ha='center', va='center', zorder=5)


def arr(axis, x1, y1, x2, y2, color, label='', lw=1.5):
    axis.annotate('', xy=(x2, y2), xytext=(x1, y1),
                  arrowprops=dict(arrowstyle='->', color=color, lw=lw,
                                  connectionstyle='arc3,rad=0'), zorder=4)
    if label:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        axis.text(mx, my + 0.17, label, color=color, fontsize=6,
                  ha='center', va='bottom', zorder=6,
                  bbox=dict(facecolor='#0f172a', edgecolor='none', alpha=0.7, pad=1))


def carr(axis, x1, y1, x2, y2, color, label='', rad=0.2, lw=1.5):
    axis.annotate('', xy=(x2, y2), xytext=(x1, y1),
                  arrowprops=dict(arrowstyle='->', color=color, lw=lw,
                                  connectionstyle='arc3,rad=' + str(rad)), zorder=4)
    if label:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        axis.text(mx + 0.1, my + 0.2, label, color=color, fontsize=6,
                  ha='center', va='bottom', zorder=6,
                  bbox=dict(facecolor='#0f172a', edgecolor='none', alpha=0.7, pad=1))


# ── TITLE ─────────────────────────────────────────────────────────
ax.text(14, 19.45, 'SportDay  -  시스템 아키텍처 & 서비스 플로우',
        color=C['text'], fontsize=16, fontweight='bold',
        ha='center', va='center', zorder=10)
ax.text(14, 18.95, 'School Sports Event Real-Time Management Platform',
        color=C['subtext'], fontsize=9, ha='center', va='center', zorder=10)

# ── ZONE BACKGROUNDS ──────────────────────────────────────────────
box(ax, 0.3, 13.5, 5.2, 5.1, '#1d4ed808', C['client_b'], radius=0.5, alpha=0.25)
ax.text(0.7, 18.35, 'CLIENT LAYER', color=C['client_b'],
        fontsize=7.5, fontweight='bold', zorder=5)

box(ax, 5.9, 10.0, 7.8, 8.6, '#0f766e08', C['frontend_b'], radius=0.5, alpha=0.25)
ax.text(6.3, 18.35, 'FRONTEND  (Next.js 16 · React 19 · Vercel)',
        color=C['frontend_b'], fontsize=7.5, fontweight='bold', zorder=5)

box(ax, 14.1, 10.0, 8.8, 8.6, '#7c3aed08', C['backend_b'], radius=0.5, alpha=0.25)
ax.text(14.5, 18.35, 'BACKEND  (NestJS 11 · TypeORM · Railway)',
        color=C['backend_b'], fontsize=7.5, fontweight='bold', zorder=5)

box(ax, 23.3, 12.5, 4.3, 6.1, '#b4530908', C['db_b'], radius=0.5, alpha=0.25)
ax.text(23.6, 18.35, 'DATA LAYER', color=C['db_b'],
        fontsize=7.5, fontweight='bold', zorder=5)

box(ax, 0.3, 0.4, 27.3, 9.2, '#be185d08', C['ext_b'], radius=0.5, alpha=0.15)
ax.text(0.7, 9.35, 'EXTERNAL SERVICES & INFRASTRUCTURE',
        color=C['ext_b'], fontsize=7.5, fontweight='bold', zorder=5)

# ── CLIENT LAYER ──────────────────────────────────────────────────
header(ax, 0.6, 16.4, 4.6, 0.7, C['client'], C['client_b'], 'Browser / PWA')
item(ax, 0.6, 15.3, 2.1, 0.85, C['client_b'], '일반 사용자', 'Public Viewer')
item(ax, 2.8, 15.3, 2.1, 0.85, C['client_b'], '관리자', 'Admin Panel')
item(ax, 0.6, 14.2, 4.6, 0.85, C['ws_b'], 'Socket.io Client', 'Real-time Listener')

# ── FRONTEND ──────────────────────────────────────────────────────
header(ax, 6.1, 16.9, 7.4, 0.75, C['frontend'], C['frontend_b'], 'Pages (App Router)')

pages = [
    ('/', '홈 대시보드'),
    ('/schedule', '일정'),
    ('/today', '오늘 경기'),
    ('/rankings', '순위'),
    ('/tournament', '토너먼트'),
    ('/youtube', 'YouTube'),
    ('/notifications', 'PWA 알림'),
    ('/admin', '관리자'),
]
pw, ph = 1.75, 0.62
for i, (route, name) in enumerate(pages):
    c = i % 4
    r = i // 4
    item(ax, 6.2 + c * (pw + 0.08), 16.1 - r * (ph + 0.1), pw, ph,
         C['frontend_b'], name, route)

header(ax, 6.1, 14.5, 7.4, 0.65, C['frontend'], C['frontend_b'], 'Services & Hooks')
item(ax, 6.2,  13.7, 2.25, 0.62, C['frontend_b'], 'api.ts',       'REST Client')
item(ax, 8.6,  13.7, 2.25, 0.62, C['frontend_b'], 'socket.ts',    'WS Factory')
item(ax, 11.0, 13.7, 2.25, 0.62, C['frontend_b'], 'useAdminData', 'Admin Hook')

header(ax, 6.1, 12.9, 7.4, 0.65, C['frontend'], C['frontend_b'], 'Key Components')
item(ax, 6.2,  12.1,  3.6, 0.62, C['frontend_b'], 'LiveInputTab',   'Real-time Score Entry')
item(ax, 9.9,  12.1,  3.6, 0.62, C['frontend_b'], 'Bracket.tsx',    'Tournament View')
item(ax, 6.2,  11.35, 3.6, 0.62, C['frontend_b'], 'RankingsClient', 'Leaderboard')
item(ax, 9.9,  11.35, 3.6, 0.62, C['frontend_b'], 'ScheduleClient', 'Match Schedule')

item(ax, 6.2, 10.2, 7.4, 0.9, C['ws_b'],
     'Socket.io  |  scoreUpdate · matchStatusChange · match:live', '')

# ── BACKEND ───────────────────────────────────────────────────────
header(ax, 14.3, 16.9, 8.4, 0.75, C['backend'], C['backend_b'], 'NestJS Modules')

modules = [
    ('MatchesModule',       'CRUD · Score · Status'),
    ('TeamsModule',         'Team Registry'),
    ('RankingsModule',      'Standings Calc'),
    ('NotificationsModule', 'Push + WS'),
    ('AdminModule',         'Token Auth Guard'),
    ('SeedModule',          'Initial Data'),
]
mw, mh = 2.6, 0.72
for i, (mod, sub) in enumerate(modules):
    c = i % 3
    r = i // 3
    item(ax, 14.4 + c * (mw + 0.1), 16.6 - (r + 1) * (mh + 0.12) + 0.4,
         mw, mh, C['backend_b'], mod, sub)

header(ax, 14.3, 13.8, 8.4, 0.65, C['backend'], C['backend_b'], 'WebSocket Gateway')
item(ax, 14.4, 13.0, 4.0, 0.65, C['ws_b'], 'MatchesGateway',       'scoreUpdate · matchStatusChange')
item(ax, 18.5, 13.0, 4.1, 0.65, C['ws_b'], 'NotificationsGateway', 'match:live · notification')

header(ax, 14.3, 12.2, 8.4, 0.65, C['backend'], C['backend_b'], 'Auth & Middleware')
item(ax, 14.4, 11.4, 3.9, 0.65, C['backend_b'], 'AdminGuard',     'x-admin-token header')
item(ax, 18.4, 11.4, 4.2, 0.65, C['backend_b'], 'ValidationPipe', 'DTO Transform/Validate')

header(ax, 14.3, 10.6, 8.4, 0.65, C['backend'], C['backend_b'], 'Entities (TypeORM)')
ew = 1.9
for i, e in enumerate(['Match', 'Team', 'ScoreLog', 'PushSubscription']):
    item(ax, 14.4 + i * (ew + 0.12), 10.2, ew, 0.28, C['db_b'], e)

# ── DATA LAYER ────────────────────────────────────────────────────
header(ax, 23.5, 17.0, 3.8, 0.7, C['db'], C['db_b'], 'Database')
item(ax, 23.5, 16.1, 3.8, 0.7, C['db_b'], 'PostgreSQL',  'Railway (Production)')
item(ax, 23.5, 15.2, 3.8, 0.7, C['db_b'], 'SQLite',      'Local Dev Fallback')
item(ax, 23.5, 14.2, 3.8, 0.7, C['db_b'], 'TypeORM',     'Auto-sync Schema')
item(ax, 23.5, 13.2, 3.8, 0.7, C['db_b'], '.vapid.json', 'VAPID Keys Store')

# ── EXTERNAL SERVICES ─────────────────────────────────────────────
ext_items = [
    (0.5,  5.2, 4.0, 1.5, C['ext_b'],      'Railway',      'Backend Hosting\nNestJS + PostgreSQL'),
    (4.9,  5.2, 4.0, 1.5, C['frontend_b'], 'Vercel',       'Frontend Hosting\nNext.js SSR/SSG'),
    (9.3,  5.2, 4.0, 1.5, C['ws_b'],       'Web Push API', 'PWA Notifications\n(VAPID + browser)'),
    (13.7, 5.2, 4.0, 1.5, C['ext_b'],      'YouTube',      'Live Stream Embed\niframe / URL'),
    (18.1, 5.2, 4.0, 1.5, C['backend_b'],  'Socket.io',    'WebSocket Transport\n+ Polling Fallback'),
    (22.5, 5.2, 4.9, 1.5, C['db_b'],       'PostgreSQL',   'Production DB\non Railway'),
]
for (x, y, w, h, col, name, sub) in ext_items:
    box(ax, x, y, w, h, col + '22', col, radius=0.3, alpha=0.9)
    ax.text(x + w / 2, y + h - 0.42, name, color=C['label'],
            fontsize=9, fontweight='bold', ha='center', va='center', zorder=5)
    ax.text(x + w / 2, y + h - 0.85, sub, color=C['subtext'],
            fontsize=7, ha='center', va='center', zorder=5)

# ── SERVICE FLOW STEPS ────────────────────────────────────────────
flow_steps = [
    (0.8,  2.8, 'STEP 1\n사용자 HTTP 요청'),
    (5.1,  2.8, 'STEP 2\nNext.js SSR'),
    (9.4,  2.8, 'STEP 3\nNestJS 처리'),
    (13.7, 2.8, 'STEP 4\nDB 쿼리'),
    (18.0, 2.8, 'STEP 5\nWS 브로드캐스트'),
    (22.3, 2.8, 'STEP 6\nPWA Push 알림'),
]
for (fx, fy, ftxt) in flow_steps:
    box(ax, fx, fy - 0.15, 3.8, 1.0, '#1e293b', '#475569', radius=0.2, alpha=0.95)
    ax.text(fx + 1.9, fy + 0.35, ftxt, color=C['subtext'],
            fontsize=6.8, ha='center', va='center', zorder=5)
for i in range(len(flow_steps) - 1):
    arr(ax, flow_steps[i][0] + 3.85, flow_steps[i][1] + 0.35,
        flow_steps[i + 1][0] - 0.05, flow_steps[i + 1][1] + 0.35,
        C['arrow_http'], lw=2.0)

# ── SCORE UPDATE DETAIL FLOW ──────────────────────────────────────
ax.text(8.0, 4.35, '[ 실시간 점수 업데이트 플로우 ]', color=C['ws_b'],
        fontsize=8, fontweight='bold', zorder=5)
flow2 = [
    (8.0,   4.0, '관리자\nPUT score'),
    (10.85, 4.0, 'MatchesService\nupdateScore()'),
    (13.7,  4.0, 'ScoreLog\n저장'),
    (16.55, 4.0, 'Gateway\nemit()'),
    (19.4,  4.0, '모든 클라이언트\n실시간 업데이트'),
]
fw, fh = 2.6, 0.82
for i, (fx, fy, ftxt) in enumerate(flow2):
    box(ax, fx, fy - fh / 2, fw, fh, '#1e293b', C['ws_b'], radius=0.2, alpha=0.95)
    ax.text(fx + fw / 2, fy, ftxt, color=C['label'],
            fontsize=6.8, ha='center', va='center', zorder=5)
    if i < len(flow2) - 1:
        arr(ax, fx + fw, fy, fx + fw + 0.28, fy, C['ws_b'], lw=1.8)

# ── MAIN ARROWS ───────────────────────────────────────────────────
arr(ax,  5.1, 16.2, 5.9,  16.2, C['arrow_http'], 'HTTP')
carr(ax, 5.1, 15.1, 6.2,  10.95, C['arrow_ws'],  'WS', rad=0.15)
arr(ax,  13.6, 15.5, 14.2, 15.5, C['arrow_http'], 'REST API')
arr(ax,  13.6, 10.65, 14.2, 10.65, C['arrow_ws'], 'Socket.io')
arr(ax,  22.7, 15.5, 23.4, 15.5, C['arrow_http'], 'TypeORM')
carr(ax, 14.4, 13.3, 13.5, 12.5, C['arrow_ws'],  'emit', rad=-0.2)
carr(ax, 18.0, 10.5, 11.0,  5.9, C['arrow_push'], 'Web Push', rad=0.2)

# ── API ENDPOINT REFERENCE ────────────────────────────────────────
ax.text(0.5, 8.85, '주요 API 엔드포인트', color=C['text'],
        fontsize=8, fontweight='bold', zorder=5)
endpoints = [
    ('GET',    '/api/matches',                  '경기 목록 조회'),
    ('PUT',    '/api/matches/:id/score',        '점수 업데이트'),
    ('PUT',    '/api/matches/:id/status',       '경기 상태 변경'),
    ('GET',    '/api/rankings',                 '순위 계산'),
    ('GET',    '/api/teams',                    '팀 목록'),
    ('POST',   '/notifications/push/subscribe', 'PWA 구독'),
    ('DELETE', '/api/matches/:id',              '경기 삭제'),
    ('GET',    '/api/admin/verify',             '관리자 인증'),
]
mcol = {'GET': '#22c55e', 'POST': '#3b82f6', 'PUT': '#f59e0b', 'DELETE': '#ef4444'}
for i, (method, path, desc) in enumerate(endpoints):
    yi = 8.42 - i * 0.45
    col = mcol.get(method, '#94a3b8')
    box(ax, 0.5, yi - 0.12, 0.72, 0.3, col + '33', col, radius=0.08, alpha=0.9)
    ax.text(0.86, yi + 0.03, method, color=col, fontsize=5.5,
            fontweight='bold', ha='center', va='center', zorder=6)
    ax.text(1.32, yi + 0.03, path, color=C['label'],
            fontsize=6.3, va='center', zorder=6)
    ax.text(6.1, yi + 0.03, '- ' + desc, color=C['subtext'],
            fontsize=6.3, va='center', zorder=6)

# ── LEGEND ────────────────────────────────────────────────────────
ax.text(0.5, 1.75, 'Legend', color=C['text'], fontsize=8, fontweight='bold', zorder=5)
for i, (col, label) in enumerate([
    (C['arrow_http'], 'HTTP / REST'),
    (C['arrow_ws'],   'WebSocket'),
    (C['arrow_push'], 'Push Notification'),
]):
    lxi = 0.5 + i * 3.6
    ax.annotate('', xy=(lxi + 0.7, 1.35), xytext=(lxi, 1.35),
                arrowprops=dict(arrowstyle='->', color=col, lw=2.0), zorder=5)
    ax.text(lxi + 0.85, 1.35, label, color=col, fontsize=7.5, va='center', zorder=5)

# ── FOOTER ────────────────────────────────────────────────────────
ax.text(14, 0.2,
        'SportDay  |  NestJS + Next.js + Socket.io + PostgreSQL  |  Railway + Vercel',
        color=C['subtext'], fontsize=7.5, ha='center', va='center', zorder=5)

plt.savefig('D:/sportday/architecture.png', dpi=150, bbox_inches='tight',
            facecolor='#0f172a', edgecolor='none')
print("Saved: D:/sportday/architecture.png")
