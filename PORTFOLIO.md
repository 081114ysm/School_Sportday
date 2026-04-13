# 프로젝트

---

# School Sportday

> **경소마고 체육대회 실시간 스코어보드 웹 서비스**
> 2026.04 (1인 개발)

> **역할 : 풀스택 1인 개발**
> (프론트엔드 + 백엔드 전체 담당)
>
> 개발 스택 : Next.js, NestJS, TypeORM, Socket.IO, PostgreSQL, PWA(Web Push)
> 팀원 : 1인 개발
> 배포 : Vercel(프론트엔드) + Railway(백엔드 + PostgreSQL)
> Tools : GitHub, Railway, Vercel

[GitHub - sportday](https://github.com/081114ysm/sportday)

---

# 담당한 기능

---

> ### 1. Socket.IO 기반 실시간 스코어보드 구현
>
> - **Socket.IO를 활용한 서버 → 전체 클라이언트 실시간 점수 전파 구조 설계**
> - 점수 변경, 경기 상태 전환, 경기 생성/삭제 등 **모든 변경 사항을 1초 이내 반영**
> - **싱글턴 패턴**으로 소켓 인스턴스 관리 → 여러 컴포넌트가 동일 인스턴스 공유, 중복 연결 방지
> - 연결 해제 시 **지수 백오프 기반 무한 재연결** → 네트워크 불안정 환경에서도 중단 없이 유지

---

> ### 2. 관리자 점수 입력 시스템 구현
>
> - **실시간 점수 +/- 조정 및 ScoreLog 기반 점수 되돌리기(Undo) 구현**
> - **배구 / 배드민턴 멀티 세트 점수 관리** → 세트별 점수를 `setsJson` 컬럼에 JSON 직렬화 저장
> - 401 응답 수신 시 **커스텀 이벤트 기반 자동 재인증 유도** → 페이지 리로드 없이 로그인 폼 복귀
> - 결과 직접 편집 시 **scoreA/scoreB 변경과 동시에 `setsJson` 자동 동기화** → 토너먼트·순위 반영 보장
>
> **핵심 처리**
>
> - 일반 종목과 멀티 세트 종목을 **같은 핸들러에서 분기** → `isMultiSet(sport)` 여부로 API 경로 결정
> - 세트 완료 판정에 **듀스 규칙 포함** — 배구: 25점 + 2점 차, 배드민턴: 21점 + 2점 차 / 30점 캡
> - `status=DONE` 저장 시 `result` 문자열 자동 계산 → 결과 카드에 즉시 반영
>
> **구현 방식**
>
> - `setsJson` 변경마다 `findIndex(미완료 세트)` 로 **활성 세트 인덱스 자동 갱신**
> - API 레이어 401 수신 → `dispatchEvent` → 훅에서 수신해 **자동 로그인 복귀**

---

> ### 3. 일정 / 순위 / 토너먼트 페이지 구현
>
> - **경기 일정표** — 요일 탭(월~금), 시간대별 타임라인, 상태 뱃지(예정 / LIVE / 종료)
>   - 완료된 경기(`status=DONE`)는 일정 페이지에서 자동 제외 → 지나간 경기 노출 방지
> - **순위표** — 학년별/팀별 탭 필터, 승·무·패 집계, 최근 5경기 폼, 포디움 배너
>   - Socket.IO `matchUpdate` / `matchStatusChange` / `scoreUpdate` 이벤트 수신으로 **실시간 자동 갱신**
>   - 학년반 팀의 경기 결과를 소속 클럽팀(A/B/C/D)에 **자동 귀속** → `GRADE_CLASS_TO_CLUB` 매핑 + `effectiveIds()` 확장
> - **토너먼트 대진표** — SEMI1 / SEMI2 / FINAL 단계 시각화
>   - 준결승 승자를 결승 카드에 **자동 반영** (팀명 표시)
>   - 결승 경기 생성 시 **준결승 승자 팀만 선택 가능**하도록 제한
>   - 이긴 팀 연결 커넥터를 결승까지 **초록색으로 강조**
>
> **여자연합 팀 귀속 처리**
>
> - 연합팀(AC·BD) 경기 결과를 구성팀(A/C, B/D)에 **귀속해 순위 산정**
> - `unionMap` 매핑 + `effectiveIds(tid)` 헬퍼로 **일반·연합·클럽 팀을 같은 로직으로 처리**
> - 연합팀 자체는 **순위표에서 제외**

---

> ### 4. PWA Web Push 알림 구현
>
> - **Service Worker + Web Push API 기반 백그라운드 시스템 알림 구현**
> - VAPID 키 최초 부팅 시 자동 생성 후 `.vapid.json` **영속 저장** → 재기동 시 기존 구독 무효화 방지
> - **죽은 구독 자동 정리** → 전송 시 404/410 응답 수신 즉시 DB 삭제
>
> **구현 내용**
>
> - 환경변수 우선, 없으면 파일 로드/생성으로 **운영·개발 환경 자동 분기**
> - 권한 요청 → 공개 키 수신 → `pushManager.subscribe()` → 서버 등록 **4단계 순차 처리**
> - `Promise.all` 병렬 전송으로 **구독자 수에 관계없이 전송 지연 최소화**

---

> ### 5. 백엔드 풀스택 설계 및 구현
>
> - **NestJS 11 + TypeORM 기반 RESTful API 전체 설계 및 구현**
> - SQLite(로컬) / PostgreSQL(Railway) **환경별 DB 자동 선택** → 코드 변경 없이 환경 전환
> - `ScoreLog` 엔티티로 **점수 변경 이력 관리** → Undo 기능의 데이터 근거
> - GET 요청은 인증 불필요, 관리자 전용 라우트만 **API 레이어에서 토큰 자동 첨부**
>
> **자동 상태 관리**
>
> - `OnModuleInit` + `setInterval` — **부팅 시 1회 + 10분 주기**로 과거 경기 자동 DONE 처리
> - `normalizePastStatus()` 를 프론트 API 레이어에도 적용 → **백엔드 10분 공백을 즉시 보완**

---

# 문제 발견 및 해결방안

---

> ## 날짜 없는 스키마로 자동 상태 전환 불가
>
> - 초기 `Match` 엔티티가 `day: string`(요일 문자열: '월', '화'…)만 가지고 있어
>   "이 경기가 실제로 언제인지"를 DB가 알 수 없는 구조
> - `matchDate < today` 같은 날짜 비교가 원천적으로 불가능해 자동 종료 로직 구현 불가
> - 주차별 날짜 매핑(`월 = 2026-04-06` …)을 코드에 하드코딩 → **주가 바뀌면 코드를 직접 수정해야 하는 유지보수 부담**
> - 백엔드는 그 매핑을 알지 못해 cron이 불완전한 상태로 방치됨
>
> ### 원인
>
> - 한 주짜리 단기 이벤트라고 가정하고 요일만 저장한 **설계 미스**
> - "파생 가능한 값(요일 라벨)은 저장하고, 파생의 근거(실제 날짜)는 생략한" 역전된 설계
>
> ### 해결
>
> - `Match` 엔티티에 `matchDate: string | null` (ISO `YYYY-MM-DD`) 컬럼 추가
> - `synchronize: true` 로 SQLite **자동 마이그레이션** 적용 (별도 마이그레이션 파일 불필요)
> - 관리자 폼의 "요일 select"를 `<input type="date">` 로 교체
> - 저장 시 요일 라벨(`월`/`화`/…)은 날짜에서 **자동 파생**해 레거시 display 호환 유지
> - 주차 매핑 하드코딩(`eventWeek.ts`의 `getEventWeekDates` 관련 로직 포함) **전부 제거**
>
> ```typescript
> // backend/src/matches/match.entity.ts
> @Column({ nullable: true })
> matchDate: string | null; // YYYY-MM-DD 형식 — 날짜 비교의 근거
>
> // frontend/src/components/admin/adminUtils.ts
> const KO_DOW = ['일', '월', '화', '수', '목', '금', '토'];
>
> // 날짜 문자열에서 요일 라벨 자동 파생 — '2026-04-07' → '화'
> export function dayLabelFromDate(ymd: string): string {
>   const [y, m, d] = ymd.split('-').map(Number);
>   return KO_DOW[new Date(y, m - 1, d).getDay()];
> }
>
> // 저장 시 날짜 입력 → 요일 자동 파생
> const dayLabel = dayLabelFromDate(newMatch.matchDate);
> await createMatch({ ...newMatch, day: dayLabel });
> ```
>
> **교훈** : "파생 가능한 값은 저장하지 말고, 파생의 근거(실제 날짜)는 반드시 저장한다."
> 초기 스키마에서 요일만 저장한 결정이 이후 여러 번의 우회 로직을 낳았다.

---

> ## 관리자가 접속해야만 상태가 동기화되는 문제
>
> - `effectiveStatus` 기반 날짜 동기화가 관리자가 `/admin` 에 접속해 `loadData()` 가 실행될 때만 발생
> - 사용자만 접속하는 시간대에는 날짜가 지난 경기가 "예정"으로 그대로 표시
> - 관리자가 당일 접속하지 않으면 **사용자는 하루 종일 잘못된 상태를 보게 되는** 사용자 경험 문제
>
> ### 원인
>
> - 상태 동기화 책임이 **프론트엔드 `loadData()`에 묶여 있음**
> - 백엔드가 독립적으로 상태를 관리하지 못하고 관리자 접속에 의존하는 구조
>
> ### 해결
>
> - `MatchesService` 에 `OnModuleInit` 구현 — **서버 부팅 시 1회 + 10분 주기 `setInterval`** 로 자동화
> - `matchDate < today` + `status ≠ DONE` + `status ≠ LIVE` 조건으로 과거 경기를 DONE 처리
> - `@nestjs/schedule` 같은 새 의존성 추가 없이 **표준 `setInterval`** 로 해결
> - 프론트 `loadData()` 에서도 파생값과 저장값이 다르면 **백엔드에 즉시 동기화** 유지
>
> ```typescript
> // backend/src/matches/matches.service.ts
> onModuleInit() {
>   void this.autoFinalizePastMatches(); // 부팅 즉시 1회
>   this.autoTimer = setInterval(
>     () => void this.autoFinalizePastMatches(),
>     10 * 60 * 1000, // 이후 10분마다 반복
>   );
> }
> onModuleDestroy() {
>   if (this.autoTimer) clearInterval(this.autoTimer); // 종료 시 타이머 정리
> }
> ```
>
> ```typescript
> // frontend/src/hooks/admin/useAdminData.ts
> // 관리자 loadData() — 파생값과 저장값이 다른 경기만 골라 백엔드도 동기화
> const toFix = matchData.filter(m => {
>   const eff = effectiveStatus(m); // 날짜 기반 파생 상태
>   return eff !== m.status && m.status !== 'LIVE';
> });
> if (toFix.length > 0) {
>   const updated = await Promise.all(
>     toFix.map(m => updateMatchStatus(m.id, effectiveStatus(m)).catch(() => null)),
>   );
>   // 동기화된 경기를 로컬 상태에도 반영
>   const updatedMap = new Map(updated.filter(Boolean).map(m => [m!.id, m!]));
>   setMatches(matchData.map(m => updatedMap.get(m.id) ?? m));
> }
> ```

---

> ## DB 상태와 실제 날짜가 불일치하는 표시 오류
>
> - 미래 날짜 경기가 DB에 `DONE`으로 저장되면 그대로 "종료"로 표시
> - 날짜가 이미 지난 경기가 `SCHEDULED`로 남아 사용자에게 "예정"처럼 보임
> - DB에 저장된 상태 값과 실제 시간 흐름이 일치하지 않아 **관리자/사용자 모두에게 혼란**
>
> ### 원인
>
> - `match.status` 는 DB에 저장된 **정적인 값** 으로 실제 시간의 흐름을 반영하지 못함
> - 상태를 "한 번 저장하면 끝"으로 설계해 날짜 경과에 따른 상태 재계산 로직이 부재
>
> ### 해결
>
> - `effectiveStatus(match)` 헬퍼 함수 구현
>   - LIVE 상태는 그대로 유지
>   - 나머지는 `matchDate` 와 오늘 날짜를 비교해 **파생 상태를 동적으로 계산**
>   - 오늘 경기(matchDate = today)는 DB 저장 값을 그대로 사용 (당일 관리자 조작 보존)
> - 관리자 페이지의 모든 뱃지·드롭다운이 이 파생값을 사용하도록 **일괄 교체**
> - `normalizePastStatus()` 와 `effectiveStatus()` 를 **프론트·백엔드 양쪽에서 이중 보완**
>
> ```typescript
> // frontend/src/components/admin/adminUtils.ts
> export function effectiveStatus(match: Match): 'LIVE' | 'DONE' | 'SCHEDULED' {
>   if (match.status === 'LIVE') return 'LIVE';          // LIVE는 항상 우선
>   if (!match.matchDate) return match.status ?? 'SCHEDULED'; // matchDate 없으면 DB 값 유지
>   const today = todayYmd();
>   if (match.matchDate < today) return 'DONE';          // 날짜 지난 경기 → DONE
>   if (match.matchDate > today) return 'SCHEDULED';     // 미래 경기 → SCHEDULED
>   return match.status ?? 'SCHEDULED';                  // 오늘 경기 → DB 값 유지
> }
> ```

---

> ## PWA 푸시 알림이 코드만 있고 실제로 동작하지 않는 문제
>
> - 기존 `sw.js` 는 `postMessage({type:'show-notification'})` 수신 경로만 존재
>   → **페이지가 열려 있을 때만 알림이 뜨고**, 백그라운드 알림이 전혀 동작하지 않음
> - `web-push` 라이브러리 미설치, VAPID 키 없음
> - 브라우저 `PushSubscription`(endpoint + keys)을 저장할 엔티티 부재
> - 여러 곳에서 동시에 문제가 얽혀 있어 **하나씩 레이어를 짚어가며 해결 필요**
>
> ### 원인
>
> - Push 구독 흐름 중 Service Worker의 `push` 이벤트 핸들러가 누락된 채 방치
> - 푸시 전송 인프라(VAPID, `web-push`, 구독 저장소) 전체가 미구현 상태
>
> ### 해결 (레이어별 순차 해결)
>
> **1단계 — Service Worker `push` 이벤트 핸들러 추가**
>
> ```javascript
> // frontend/public/sw.js
> self.addEventListener('push', (event) => {
>   const data = event.data?.json() ?? {};
>   event.waitUntil(
>     self.registration.showNotification(data.title, { body: data.body, icon: '/icon-192.png' })
>   );
> });
>
> self.addEventListener('notificationclick', (event) => {
>   event.notification.close();
>   event.waitUntil(
>     clients.matchAll({ type: 'window' }).then((list) => {
>       const existing = list.find(c => c.url === '/' && 'focus' in c);
>       return existing ? existing.focus() : clients.openWindow('/'); // 탭 재사용
>     })
>   );
> });
> ```
>
> **2단계 — VAPID 키 자동 생성 및 영속 저장**
>
> ```typescript
> // backend/src/notifications/push.service.ts
> // 환경변수(운영) 우선, 없으면 파일(로컬) 로드/생성
> if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
>   this.publicKey = process.env.VAPID_PUBLIC_KEY;   // Railway 환경변수
> } else if (fs.existsSync(VAPID_FILE)) {
>   const keys = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8'));
>   this.publicKey = keys.publicKey;                  // 로컬 파일에서 로드
> } else {
>   const keys = webpush.generateVAPIDKeys();         // 최초 생성 후 파일 저장
>   fs.writeFileSync(VAPID_FILE, JSON.stringify(keys, null, 2));
>   this.publicKey = keys.publicKey;
> }
> ```
>
> **3단계 — `PushSubscription` 엔티티 추가**
>
> - `endpoint` 를 PK로, `p256dh` + `auth` + 선택적 `userSub` / `teamId` 저장
> - 기존 소켓 기반 알림 경로(인앱 알림)는 건드리지 않고 Push 경로만 별도 추가
>
> **4단계 — NestJS decorator metadata 충돌(`TS1272`) 우회**
>
> ```typescript
> // 수정 전 — @Body() 에 인터페이스 타입 직접 참조 → TS1272
> pushTest(@Body() body: PushPayload) { ... }
>
> // 수정 후 — 인라인 객체 타입으로 교체 (emitDecoratorMetadata 충돌 회피)
> pushTest(@Body() body: { title: string; body: string; url?: string }) { ... }
> ```
>
> **5단계 — `Uint8Array → BufferSource` 타입 불일치 캐스트**
>
> ```typescript
> // 최신 TS lib의 Uint8Array<ArrayBufferLike>가 BufferSource와 타입 불일치
> // 런타임 값은 정상이므로 의도적 캐스트로 처리
> applicationServerKey: urlBase64ToUint8Array(key) as unknown as BufferSource,
> ```

---

> ## 세트제 종목 직접 편집 시 토너먼트·순위에 결과가 반영되지 않는 문제
>
> - 관리자 "결과 입력" 탭에서 빅발리볼·배드민턴 점수를 직접 수정해도
>   토너먼트 대진표와 결과 카드에 변경이 **전혀 반영되지 않음**
>
> ### 원인
>
> - 프론트 `handleEditResult`는 `{ scoreA, scoreB, status }` 만 백엔드 `update()`로 전송
> - 백엔드 `update()`는 `scoreA/scoreB` 는 저장하지만 **`setsJson`는 건드리지 않음**
> - 토너먼트 승자 판정(`matchWinner`)과 점수 표시(`getMatchScorePair`)는
>   세트제 종목에 대해 `scoreA/scoreB` 대신 **`setsJson`의 세트 승수를 읽음**
> - 결과: DB에 `scoreA=2, scoreB=1`이 저장되어 있어도 `setsJson`이 옛 값이면 승자가 잘못 계산됨
>
> ### 해결
>
> - 백엔드 `update()` 메서드에 **`setsJson` 자동 동기화 블록 추가**
> - `isMultiSetSport(sport)` + `scoreA/scoreB` 변경 감지 시 세트 배열을 역산해 `setsJson` 재생성
>
> ```typescript
> // backend/src/matches/matches.service.ts — update() 내
> if (isMultiSetSport(current.sport) && (next.scoreA !== undefined || next.scoreB !== undefined)) {
>   const wA = Math.max(0, Math.round(next.scoreA ?? current.scoreA ?? 0));
>   const wB = Math.max(0, Math.round(next.scoreB ?? current.scoreB ?? 0));
>   const sets: { a: number; b: number }[] = [];
>   let ai = 0, bi = 0;
>   while (ai < wA || bi < wB) {
>     if (ai < wA) { sets.push({ a: 25, b: 20 }); ai++; }
>     if (bi < wB) { sets.push({ a: 20, b: 25 }); bi++; }
>   }
>   next.setsJson = JSON.stringify(sets); // scoreA/scoreB 변경과 동시에 setsJson 재생성
> }
> ```
>
> **교훈** : 같은 데이터를 두 컬럼(`scoreA/scoreB`, `setsJson`)에 중복 저장할 때는
> 어느 쪽이 **진실의 원천(source of truth)** 인지 명확히 정하고,
> 어느 경로로 쓰더라도 양쪽이 **항상 동기화** 되도록 저장 레이어에서 보장해야 한다.

---

> ## 관리자 페이지와 사용자 페이지 디자인 이질감
>
> - `/admin` 은 다크 테마 (`#0a0b0e` 배경, 형광 노랑 `#e8ff47` accent)
> - 사용자 페이지는 라이트 팔레트 (`#f6f8fa` 배경, `#2bbf7e` 초록)
> - 같은 URL 하에 있는 서비스인데 **완전히 다른 앱처럼 느껴지는 이질감**
> - 관리자용이라 의도적으로 구분한 것이 아니라 초기 개발 시 **스타일 분리가 무계획적으로 진행된 결과**
>
> ### 원인
>
> - `admin.module.css` 가 `.adminPage` 스코프 안에서 `--bg`, `--accent` 등 자체 CSS 변수를 정의해
>   전역 `globals.css` 팔레트와 **완전히 독립적으로 동작**
>
> ### 해결
>
> - `.adminPage` 의 CSS 변수 블록을 전역 팔레트와 **동일한 값으로 일괄 교체**
> - accent 위 텍스트 `color: var(--bg)` 가 밝은 배경에서 대비가 깨지는 부분을 `color: #fff` 로 일괄 치환
> - **CSS 변수 블록 한 곳만 수정해 관리자 UI 전체 톤 통일** — 컴포넌트 개별 수정 불필요
>
> ```css
> /* admin.module.css — 수정 전 (다크 테마) */
> .adminPage {
>   --bg:     #0a0b0e;
>   --bg2:    #12141a;
>   --text:   #e8e8e8;
>   --accent: #e8ff47; /* 형광 노랑 */
>   --border: #2a2d36;
> }
>
> /* admin.module.css — 수정 후 (전역 팔레트와 동일) */
> .adminPage {
>   --bg:     #f6f8fa;
>   --bg2:    #ffffff;
>   --text:   #1f2937;
>   --accent: #2bbf7e; /* 브랜드 초록 */
>   --border: #e5e7eb;
> }
> ```
