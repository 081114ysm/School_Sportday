# 요구사항 명세서 — 경소마고 체육대회 예선전 실시간 플랫폼

---

## 1. 개요

경북소프트웨어마이스터고등학교 **체육대회 예선전**을 실시간으로 운영·중계하고, 학생·관중이 한 화면에서 일정/점수/랭킹/유튜브 중계를 확인할 수 있도록 하는 웹 기반 플랫폼이다. 모바일 우선 PWA로 설치·오프라인 캐싱·브라우저 알림을 지원하며, 운영진은 관리자 패널에서 경기·팀·점수·중계 URL을 실시간으로 관리한다.

---

## 2. 목적

- 예선전 일정/결과/랭킹의 **단일 진실 공급원(SSOT)** 제공
- **WebSocket** 기반 1초 이내 실시간 점수/상태 전파
- **YouTube 라이브/다시보기** 통합 시청
- 학교 통합로그인(**GBSW Archive SSO**) 기반 팀 구독·알림 개인화
- 관중 중심의 **모바일 퍼스트** 반응형 UX

---

## 3. 사용자 정의

| 사용자 유형 | 설명 |
| --- | --- |
| 관중/학생 | 일정·실시간 경기·랭킹·유튜브 시청, (로그인 시) 팀 구독 알림 수신 |
| 운영진/스코어러 | 경기 점수 입력, 상태(예정/진행/종료) 변경, YouTube URL 등록 |
| 관리자 | 팀/경기/일정 CRUD, 사용자 페이지와 통일된 라이트 테마 어드민 패널 |
| SSO 로그인(선택) | GBSW Archive 로그인으로 구독·알림 사용 가능, 비로그인도 시청은 가능 |

---

## 4. 기능 요구사항

### 4.1 메인 대시보드 `/`

| ID | 기능명 | 설명 |
| --- | --- | --- |
| M-01 | 히어로 | 2026 체육대회 예선전 타이틀, 일러스트 |
| M-02 | 통계 요약 | 총 경기 / 완료 / 진행 중 / 참가팀 4 카드 |
| M-03 | 바로가기 | 일정·오늘경기·랭킹·유튜브 4개 단축 링크 (LIVE 표시) |
| M-04 | CTA | "경기 일정" / "리그전 순위" 버튼 |

### 4.2 일정표 `/schedule`

| ID | 기능명 | 설명 |
| --- | --- | --- |
| S-01 | 요일 탭 | 월~금 5일 + 각 요일 경기 수/LIVE 배지 |
| S-02 | 타임라인 | 선택 요일의 경기 카드를 시간대(점심/저녁) 순으로 표시 |
| S-03 | 상태 뱃지 | 예정/LIVE/종료 3종, 점수 노출 |
| S-04 | 메타 | 장소·카테고리(학년전/연합전) 표시 |

### 4.3 오늘 경기 / 실시간 `/today`

| ID | 기능명 | 설명 |
| --- | --- | --- |
| T-01 | 오늘 일정표 | 좌측 표: 시간/종목/대결/상태/점수 |
| T-02 | 실시간 스코어보드 | 우측 카드: 진행 중 경기 팀/점수/카테고리 |
| T-03 | 실시간 수신 | socket `scoreUpdate`·`matchUpdate`로 1초 내 갱신 |
| T-04 | LIVE 강조 | LIVE 행 하이라이트, pulse LIVE 뱃지 |

### 4.4 순위 `/rankings`

| ID | 기능명 | 설명 |
| --- | --- | --- |
| R-01 | 탭 필터 | 전체 / 1학년 / 2학년 / 3학년 / 팀별(CLUB) |
| R-02 | 순위 테이블 | 순위·팀·경기·승·무·패·득점·실점·득실차·승점·최근 5경기 |
| R-03 | 최근 5경기 | 승/무/패 칩 + 상대팀명 표시 |
| R-04 | 1위 배너 | 현재 종합 1위 팀 + 승점 하이라이트 |

### 4.5 유튜브 중계 `/youtube`

| ID | 기능명 | 설명 |
| --- | --- | --- |
| Y-01 | 메인 플레이어 | 선택된 영상 16:9 iframe, LIVE 뱃지 |
| Y-02 | 다가오는 일정 | SCHEDULED/LIVE 매치 카드 리스트 |
| Y-03 | 지난 경기 | DONE 매치 카드 리스트, socket `match:ended` 시 자동 이동 |
| Y-04 | 알림 토글 | 카드별 구독(localStorage + 백엔드) |
| Y-05 | 라이브 수신 | socket `match:live` 수신 → 브라우저 Notification |

### 4.6 통합 로그인 `/login`, `/auth/callback` (선택)

| ID | 기능명 | 설명 |
| --- | --- | --- |
| AU-01 | SSO 진입 | GBSW Archive(OIDC implicit, id_token) redirect |
| AU-02 | 콜백 처리 | id_token → `POST /api/auth/sso` → 백엔드 JWT 획득 |
| AU-03 | 세션 관리 | localStorage 보관, `sportday:auth` 커스텀 이벤트 |
| AU-04 | 로그아웃 | 세션 제거 후 메인 이동 |

### 4.7 알림 `/notifications`

| ID | 기능명 | 설명 |
| --- | --- | --- |
| N-01 | 팀 구독 | 팀 리스트에서 토글 구독/해제 (로그인 시) |
| N-02 | PWA 푸시 | `PushManager.subscribe` + VAPID 기반 Web Push. 탭을 닫은 상태에서도 시스템 알림 수신. 활성/비활성 토글 + 테스트 전송 버튼 제공 |
| N-03 | 실시간 수신 | socket `match:live` / `match:ended` / `scoreUpdate` (포그라운드 보조 경로) |
| N-04 | 이력 조회 | 최근 알림 목록 (localStorage 보관) |
| N-05 | 비로그인 허용 | 팀 구독만 로그인 필요. PWA 푸시 on/off는 비로그인 상태에서도 가능 |
| N-06 | 사용 방법 안내 | 접속 조건(localhost/HTTPS), 권한 허용, iOS 홈 화면 추가, 알림 끄는 방법을 접힘 카드로 문서화 |

### 4.8 관리자 `/admin`

| ID | 기능명 | 설명 |
| --- | --- | --- |
| AD-01 | 실시간 입력 | 경기 선택 → 점수 +/- / 실행취소 / 시작·종료. LIVE 경기가 드롭다운 최상단 |
| AD-02 | 결과 보기 | 종목 필터 + 상태 필터(전체/LIVE/예정/종료), 결과 카드 그리드, 실제 날짜 표시 |
| AD-03 | 일정 관리 | 경기 CRUD. 종목/**날짜(`<input type="date">`)**/시간(점심 12:50 / 저녁 18:30)/카테고리/팀A/팀B. 종목·날짜 필터, 🔴 진행 중 / ⏳ 예정 상태별 그룹핑. 종료된 경기는 목록에서 자동 제외 |
| AD-04 | 팀 관리 | 팀 CRUD (이름/학년/반), 아바타 카드 |
| AD-05 | YouTube 관리 | 경기별 URL 등록 → socket `match:live` + **Web Push 브로드캐스트**. 상태별(진행 중/예정/종료) 그룹핑 |
| AD-06 | 라이트 테마 | 사용자 페이지와 동일한 라이트 팔레트(`#f6f8fa` / `#2bbf7e`)로 통일 |
| AD-07 | 자동 상태 파생 | 경기 날짜가 지났는데 DB 상태가 `DONE`이 아니면 `effectiveStatus`로 파생해 표시하고, 백엔드 동기화도 호출 |

### 4.9 PWA

| ID | 기능명 | 설명 |
| --- | --- | --- |
| P-01 | Manifest | `/manifest.webmanifest`, themeColor `#2bbf7e`, standalone |
| P-02 | Service Worker | `/sw.js` 등록. `push` / `notificationclick` / `message` 이벤트 처리 |
| P-03 | 아이콘 | `app/icon.png` = 학교 로고, 타이틀 "경소마고 체육대회" |
| P-04 | 설치 | Add to Home Screen 지원 |
| P-05 | Web Push 구독 | 프론트 `PushManager.subscribe` → 백엔드에 endpoint/p256dh/auth 저장. 탭 종료 상태에서도 VAPID 기반 푸시 수신 |
| P-06 | VAPID 키 관리 | 백엔드 부팅 시 최초 1회 생성 후 `backend/.vapid.json`에 저장. 이후 재기동 시 로드 |
| P-07 | 죽은 구독 정리 | 전송 시 404/410 응답이면 자동으로 DB에서 삭제 |
| P-08 | 이벤트 연동 | 경기 LIVE 전환 + 유튜브 URL 등록 시 `pushService.sendToAll(...)`로 자동 브로드캐스트 |

### 4.11 자동 상태 전환 (배치)

| ID | 기능명 | 설명 |
| --- | --- | --- |
| AF-01 | 과거 경기 자동 종료 | 백엔드 `MatchesService.onModuleInit` → `setInterval` 10분 주기로 `autoFinalizePastMatches()` 실행. `matchDate < today` AND `status NOT IN (DONE, LIVE)` 경기를 일괄 `DONE`으로 전환 |
| AF-02 | 프론트 파생 동기화 | 관리자가 `/admin`에 진입해 `loadData()`가 돌 때도 `effectiveStatus`와 저장값이 다르면 `updateMatchStatus`로 보정 |
| AF-03 | LIVE 보존 | LIVE 상태는 자동 종료에서 제외. 관리자가 수동으로 종료해야 함 |

### 4.10 반응형

| ID | 기능명 | 설명 |
| --- | --- | --- |
| RS-01 | 모바일 ≤640px | 단일 컬럼, 햄/스크롤 내비, 표 가로 스크롤, 터치 44px+ |
| RS-02 | 태블릿 641–960px | 2컬럼 하이브리드, 사이드바 축소, 다가오는 일정 세로 |
| RS-03 | 데스크탑 >960px | 기존 멀티 컬럼 레이아웃 유지 |
| RS-04 | 뷰포트 고정 해제 | 모바일에서 `calc(100vh-..)` 락 제거, `min-height` 사용 |

---

## 5. 비기능 요구사항

| 항목 | 내용 |
| --- | --- |
| 성능 | REST < 1s, WebSocket push < 1s |
| 보안 | JWT (백엔드 발급), SSO id_token 검증 (프로덕션), CORS 제한 |
| 확장성 | TypeORM 기반 엔티티 → SQLite → MySQL 마이그레이션 용이 |
| 사용성 | 모바일 우선, 터치 타겟 ≥40px, 브랜드 그린 컬러 통일 |
| 실시간성 | Socket.IO 자동 재연결, REST 폴백 |
| 접근성 | aria-label, 의미 태그, 색/배지 텍스트 병기 |

---

## 6. 제약사항

- DB: **better-sqlite3**(개발) → MySQL(운영) 전환 가능, **TypeORM**으로 추상화
- 백엔드: **NestJS 11** (REST + Socket.IO Gateway)
- 프론트엔드: **Next.js 15 App Router + React 19**, CSS Modules
- 인증: **GBSW Archive SSO (OIDC implicit)** + 백엔드 JWT (선택적)
- 디자인: 학교 로고 기반 **그린 (#2bbf7e)** 브랜드 컬러 고정
- 관리자 패널은 다크 테마로 스코프 분리

---

## 7. ERD (text-based)

```
Team             (id PK, name, grade?, classNumber?, category: 'GRADE'|'CLUB', color)
Match            (id PK, day, matchDate? (YYYY-MM-DD), timeSlot: 'LUNCH'|'DINNER',
                  sport, category, teamAId FK→Team, teamBId FK→Team,
                  scoreA, scoreB, status: SCHEDULED|LIVE|DONE,
                  kickoffAt?, venue?, youtubeUrl?)
ScoreLog         (id PK, matchId FK→Match, scoreA, scoreB, at)
User             (id PK, sub UQ, fullname, grade?, classNumber?, type, createdAt)
TeamSubscription (id PK, userSub, teamId FK→Team, createdAt)  -- 인앱 팀 구독
Notification     (id PK, userSub, title, body, kind, readAt?, createdAt)
PushSubscription (endpoint PK, p256dh, auth, userSub?, teamId?, createdAt)  -- 브라우저 Web Push 구독
```

### 관계

| 관계 | 카디널리티 | 설명 |
| --- | --- | --- |
| Team — Match (teamA) | 1 : N | 팀이 A측으로 참가한 경기 |
| Team — Match (teamB) | 1 : N | 팀이 B측으로 참가한 경기 |
| Match — ScoreLog | 1 : N | 경기별 점수 변경 히스토리, 되돌리기 지원 |
| User — Subscription | 1 : N | 사용자가 구독한 팀/경기 |
| Team — Subscription | 1 : N | 팀별 구독자 목록 |
| User — Notification | 1 : N | 사용자 수신 알림 |

---

## 8. API 목록

### 8.1 REST 엔드포인트

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/auth/sso` | SSO 콜백 페이로드 수신, 사용자 upsert + JWT 반환 |
| GET | `/api/auth/me` | 현재 로그인 사용자 정보 |
| GET | `/api/teams?grade=` | 팀 목록 (학년 필터) |
| POST | `/api/teams` | 팀 생성 (관리자) |
| DELETE | `/api/teams/:id` | 팀 삭제 (관리자) |
| GET | `/api/matches?day=&status=&sport=` | 경기 목록 |
| GET | `/api/matches/live` | 현재 LIVE 경기 |
| POST | `/api/matches` | 경기 생성 |
| PUT | `/api/matches/:id` | 경기 수정 |
| PUT | `/api/matches/:id/score` | 점수 +/- 조정 |
| PUT | `/api/matches/:id/status` | 상태 전이 (SCHEDULED/LIVE/DONE) |
| PUT | `/api/matches/:id/undo` | 마지막 점수 변경 되돌리기 |
| PUT | `/api/matches/:id/youtube` | YouTube URL 등록/해제 |
| DELETE | `/api/matches/:id` | 경기 삭제 |
| GET | `/api/rankings?grade=` | 랭킹 (팀별 승점/득실/최근 5경기) |
| POST | `/api/notifications/subscribe` | 팀/경기 구독 |
| DELETE | `/api/notifications/subscribe/:teamId` | 구독 해제 |
| GET | `/api/notifications` | 내 알림 목록 |
| GET | `/api/notifications/push/public-key` | VAPID 공개 키 조회 (프론트가 `PushManager.subscribe`에 사용) |
| POST | `/api/notifications/push/subscribe` | 브라우저 푸시 구독 등록 `{ subscription, userSub?, teamId? }` |
| POST | `/api/notifications/push/unsubscribe` | 구독 해제 `{ endpoint }` |
| POST | `/api/notifications/push/test` | 모든 구독자에게 테스트 푸시 전송 `{ title, body }` |
| GET | `/api/youtube/live` | 현재 LIVE 영상 |
| GET | `/api/youtube/upcoming` | 다가오는 중계 |

### 8.2 WebSocket 이벤트 (Socket.IO)

| 이벤트 | 방향 | 페이로드 | 설명 |
| --- | --- | --- | --- |
| `scoreUpdate` | 서버 → 클라 | `{ matchId, scoreA, scoreB }` | 점수 변경 푸시 |
| `matchUpdate` | 서버 → 클라 | `Match` | 경기 전체 갱신 |
| `matchCreated` | 서버 → 클라 | `Match` | 새 경기 생성 |
| `matchDeleted` | 서버 → 클라 | `{ id }` | 경기 삭제 |
| `matchStatusChange` | 서버 → 클라 | `{ matchId, status }` | 상태 전이 |
| `match:live` | 서버 → 클라 | `{ matchId, sport, teamA, teamB, youtubeUrl }` | 라이브 시작, 구독자 알림 |
| `match:ended` | 서버 → 클라 | `{ matchId }` | 경기 종료 |
| `notification` | 서버 → 클라 | `Notification` | 개인 알림 |

---

## 9. 화면(라우트) 목록

| Path | 설명 |
| --- | --- |
| `/` | 메인 대시보드 (히어로, 통계, 단축) |
| `/schedule` | 요일 타임라인 일정표 |
| `/today` | 오늘 경기표 + 실시간 스코어보드 |
| `/rankings` | 랭킹 탭 필터 + 테이블 |
| `/youtube` | 메인 플레이어 + 다가오는/지난 사이드바 |
| `/login` | GBSW SSO 진입 |
| `/auth/callback` | SSO id_token 콜백 처리 |
| `/notifications` | 팀 구독 관리 + 최근 알림 |
| `/admin` | 관리자 패널 (실시간 입력/결과/일정/팀/유튜브) |

---

## 10. 향후 확장 계획

- 디스코드/카카오 채널/이메일 알림 연동
- 하이라이트 클립 / 사진 갤러리 / 플레이어 스탯
- MySQL 전환 및 배포 자동화 (CI/CD)
- 관리자 권한 분리 (스코어러 / 슈퍼 관리자)
- 본선 토너먼트 자동 대진표 생성
- 실시간 통계 (점유율, 득점 타임라인)
- 학생증 QR 출석 체크 / 응원 투표
