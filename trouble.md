# 개발 트러블 슈팅 기록

이 문서는 체육대회 플랫폼 작업 중 실제로 마주친 문제와 해결 방법을 시간 순으로 정리한 것이다. 각 항목은 **증상 → 원인 → 해결**의 형식이다.

---

## 1. 관리자 페이지가 사용자 페이지와 톤이 달라 이질감이 있었음

- **증상**: `/admin`은 다크 테마(`#0a0b0e` 배경, 형광 노랑 `#e8ff47` accent)였고, 나머지 사용자 페이지는 `globals.css`의 라이트 팔레트(`#f6f8fa`, 초록 `#2bbf7e`)를 사용해 두 영역이 완전히 다른 앱처럼 보였다.
- **원인**: `admin.module.css`가 `.adminPage` 스코프 안에서 자체 CSS 변수(`--bg`, `--accent` 등)를 정의해 전역 팔레트와 독립적으로 동작.
- **해결**: `.adminPage`의 CSS 변수 블록을 전역 팔레트와 동일한 값으로 교체. 버튼/아이콘에서 `color: var(--bg)`가 "accent 위 텍스트"로 쓰이고 있어서, 밝은 배경색이 되면 대비가 깨지는 문제가 있어 해당 자리들을 `color: #fff`로 일괄 치환했다.

---

## 2. "종료/예정" 상태가 날짜와 무관하게 DB 값만 따라가서 잘못 보임

- **증상**: 미래 날짜 경기가 `DONE`으로 찍혀 있으면 그대로 "종료"로 표시됨. 반대로 이미 날짜가 지난 경기가 `SCHEDULED`로 남아 사용자에게 "예정"처럼 보였다.
- **원인**: `match.status`는 DB에 저장된 정적인 값일 뿐, 실제 시간의 흐름을 반영하지 못함.
- **해결**: `effectiveStatus(match)` 헬퍼를 만들어 **LIVE는 그대로, 그 외에는 날짜와 오늘을 비교**해 파생 상태를 계산. 관리자 페이지의 모든 배지/드롭다운이 이 파생값을 쓰도록 교체하고, `loadData()`에서 파생값과 저장값이 다르면 백엔드에도 `updateMatchStatus`로 자동 동기화.

---

## 3. 요일 기반 스키마라 "날짜가 지나면 자동 종료"가 원천적으로 불가능했음

- **증상**: 초기에는 관리자가 주차별 월~금 매핑(`월=2026-04-06`…)을 하드코딩해 파생 상태를 계산했다. 다음 주로 넘어가면 코드 수정이 필요하고, 백엔드는 그 매핑을 알지 못해 cron이 불완전했다.
- **원인**: `Match` 엔티티가 `day: string`(요일)만 가지고 있어서 "이 경기의 실제 날짜"라는 개념이 존재하지 않았다. 한 번 쓰고 버리는 주간 이벤트를 가정한 설계 미스.
- **해결**:
  1. `Match` 엔티티에 `matchDate: string | null` (ISO `YYYY-MM-DD`) 컬럼을 추가 (`synchronize:true`로 SQLite가 자동 마이그레이션).
  2. `CreateMatchDto`와 프론트 `Match` 타입, `createMatch` API에 `matchDate` 필드를 옵셔널로 추가.
  3. 관리자 폼의 "요일 select"를 `<input type="date">`로 교체하고, 저장 시 요일 라벨(`월`/`화`/…)은 날짜에서 자동 파생해서 같이 저장 (레거시 display 호환 유지).
  4. 주차 매핑 하드코딩(`eventWeek.ts`의 `getEventWeekDates` 관련 로직 포함)을 전부 제거.
- **교훈**: "파생 가능한 값을 저장하지 말고, 저장할 수 없는 값(실제 날짜)은 생략하지 말 것." 초기 스키마에서 요일만 저장한 게 이후 여러 번의 우회 로직을 낳았다.

---

## 4. 관리자 페이지를 열어야만 상태 동기화가 되는 문제

- **증상**: `effectiveStatus` 기반 자동 DONE 전환은 관리자가 `/admin`에 접속해 `loadData()`가 돌 때만 발생. 사용자만 들어오는 시간대에는 지난 경기가 그대로 "예정"으로 보였다.
- **원인**: 동기화 책임이 프론트에 묶여 있었음.
- **해결**: `MatchesService`에 `OnModuleInit` / `OnModuleDestroy`를 구현, **부팅 시 1회 + 10분 주기 `setInterval`**로 `autoFinalizePastMatches()`를 실행. `@nestjs/schedule` 같은 새 의존성은 추가하지 않고 표준 `setInterval`로 해결. 쿼리는 `matchDate: LessThan(today)` + `status: Not('DONE')`로 잡고, LIVE는 관리자가 수동 종료해야 하므로 코드 레벨에서 제외.

---

## 5. `TIME_SLOTS`를 객체 배열로 바꾸자 TS가 상태 타입을 너무 좁게 추론

- **증상**:
  ```
  Type 'string' is not assignable to type '"LUNCH"'.
  ```
  폼 초기값 `timeSlot: TIME_SLOTS[0].value`가 리터럴 `"LUNCH"`로 추론돼, 이후 `setNewMatch(prev => ({ ...prev, ...e.target.value }))`처럼 `string`이 흘러 들어오는 setter가 타입 에러를 냄.
- **원인**: `TIME_SLOTS`를 `as const`로 굳히고 `.value`를 꺼내면 초기 `useState` 추론이 리터럴 union에 고정됨.
- **해결**: `useState<{ sport: string; matchDate: string; timeSlot: string; ... }>(...)`로 **상태 제네릭을 명시**해 `string`으로 넓혔다. 굳이 리터럴로 좁힐 이유가 없었기에 가장 깔끔한 수정.

---

## 6. JSX `map` 중간에 구조를 `() => (...)`에서 `() => { ... return (...) }`으로 바꾸다 괄호 매칭이 깨짐

- **증상**: 일정/결과/유튜브 탭 리스트 렌더링에서 그룹핑 로직을 넣으면서 `))`, `})`, `});` 같은 닫힘이 어긋나 빌드가 깨짐.
- **해결**: 기계적으로 잘못된 부분만 찾아 수정한 뒤 `npx tsc --noEmit`으로 즉시 검증. JSX 구조 변경 후에는 반드시 타입체크를 한 번 돌리는 루틴을 유지.

---

## 7. PWA 푸시 알림이 "코드만 있고 동작은 안 됨" 상태였음

사용자 요청으로 PWA 알림이 실제로 도착하는지 확인하는 단계에서 다음 문제들이 드러났다.

### 7-1. Service Worker에 `push` 이벤트 핸들러가 없음
- **증상**: 기존 `sw.js`는 페이지에서 `postMessage({type:'show-notification'})`를 받아 알림을 띄우는 경로만 있었다. 즉 **페이지가 열려 있을 때만** 작동.
- **해결**: `self.addEventListener('push', ...)`를 추가하고, 서버에서 보낸 JSON을 파싱해 `showNotification`. `notificationclick`에서는 이미 열린 탭이 있으면 포커스 & `navigate`, 없으면 `openWindow`.

### 7-2. VAPID 키 없음 / `web-push` 라이브러리 부재
- **해결**:
  - `npm i web-push` + `npm i -D @types/web-push`.
  - `PushService`에서 최초 부팅 시 `webpush.generateVAPIDKeys()`로 키를 만들어 `backend/.vapid.json`에 저장하고, 이후에는 파일에서 로드 (재기동 시 구독이 무효화되지 않도록).

### 7-3. 기존 `TeamSubscription`은 브라우저 푸시 endpoint가 아닌 사용자 ID만 저장
- **해결**: 새 엔티티 `PushSubscription` 추가. `endpoint`를 PK로 두고 `p256dh`, `auth`, 그리고 선택적 `userSub`/`teamId`(타겟팅용)를 저장. 기존 소켓 기반 알림 경로는 건드리지 않음.

### 7-4. NestJS decorator metadata + `isolatedModules` 조합에서 `PushPayload` 타입 참조 에러
- **증상**:
  ```
  TS1272: A type referenced in a decorated signature must be imported with 'import type' or a namespace import when 'isolatedModules' and 'emitDecoratorMetadata' are enabled.
  ```
  컨트롤러 메서드 `pushTest(@Body() body: PushPayload)`에서 발생.
- **원인**: `emitDecoratorMetadata`는 런타임에 `PushPayload`의 타입 정보를 쓰려고 하지만 인터페이스는 런타임에 존재하지 않음. `import type`은 decorator metadata와 충돌.
- **해결**: `PushPayload` 참조를 제거하고 컨트롤러 시그니처에 **인라인 객체 타입**을 그대로 써서 metadata 대상에서 제외. 서비스 내부에서는 계속 `PushPayload` 인터페이스를 사용.

### 7-5. 프론트 `PushManager.subscribe`에서 `Uint8Array` → `BufferSource` 타입 불일치
- **증상**:
  ```
  Type 'Uint8Array<ArrayBufferLike>' is not assignable to type '... BufferSource ...'.
  Type 'SharedArrayBuffer' is missing the following properties from type 'ArrayBuffer': resizable, resize, detached, transfer, ...
  ```
- **원인**: 최신 TS lib의 `Uint8Array`가 `ArrayBufferLike`(= `ArrayBuffer | SharedArrayBuffer`)를 파라미터로 갖는데, `applicationServerKey`는 순수 `ArrayBuffer` 기반 `BufferSource`만 받음.
- **해결**: `as unknown as BufferSource`로 의도적 캐스트. 런타임 값은 분명히 올바르고, 이건 순수 타입 협의 문제.

### 7-6. 기존 테스트(`matches.service.spec.ts`)가 새 의존성 때문에 깨짐
- **증상**: `Expected 5 arguments, but got 4` — `MatchesService` 생성자에 `pushService`가 추가됐는데 테스트는 과거 4개 인자만 넘김.
- **해결**: 테스트 내부에 `const pushService: any = { sendToAll: jest.fn(), sendToTeam: jest.fn() };` 스텁을 추가해 5번째 인자로 주입. 실제 로직은 영향 받지 않음.

### 7-7. 백엔드 재기동 시 `EADDRINUSE: :::4001`
- **증상**: 새 코드로 재기동했는데 포트 4001이 이미 쓰이고 있어 시작 실패. curl을 던지니 여전히 **이전 버전의 응답**(`/api/notifications/push/public-key` 404)이 돌아옴 — 즉 두 서버가 다른 상태로 공존하는 혼란.
- **원인**: 이전 세션에서 뜬 stale Node 프로세스(PID 44720)가 4001을 잡고 있었음. 새로 띄운 프로세스는 라우트 매핑까지 로그 찍고 `listen`에서 실패.
- **해결**:
  1. `netstat -ano | grep :4001`로 정확한 PID 식별.
  2. `taskkill //PID 44720 //F`로 stale 프로세스만 종료(다른 dev 서버를 건드리지 않도록 PID 지정).
  3. `npm run start` 재기동 → 로그에서 `Mapped {/api/notifications/push/public-key, GET} route`, `Generated new VAPID keys`, `Web Push ready` 확인.
  4. `curl`로 `/public-key`가 실제 키를 돌려주고 `/push/test`가 `{sent:0, failed:0}`(구독자 0이라 정상)를 돌려주는 것까지 검증.
- **교훈**: "왜 404가 나지?"를 코드 탓하기 전에 **실제로 응답하는 프로세스가 내가 재기동한 그 프로세스가 맞는지**부터 확인해야 한다. 포트 충돌 로그가 있으면 네트워크 레이어부터 의심.

---

## 8. 헤드리스 환경에서 "푸시 알림이 실제로 도착하는지" 검증 불가

- **증상**: 명령줄 세션에서는 브라우저 권한 팝업 허용, 시스템 알림 수신 같은 부분을 자동화할 수 없었다.
- **해결 대안**: 검증을 **레이어별로 쪼개서** 가능한 부분만 책임졌다.
  1. 타입체크(`tsc --noEmit`) — 프론트/백엔드 모두 클린.
  2. 백엔드 실제 기동 + 라우트 매핑 로그 확인.
  3. `curl`로 `/public-key`, `/push/test` 응답 확인.
  4. 나머지(권한 허용 → 실제 알림 수신)는 `trouble.md`와 별개로 수동 검증 절차를 사용자에게 전달.
- **교훈**: 검증할 수 없는 영역은 숨기지 말고 명시적으로 사용자에게 남겨야 한다. "완벽하게 했습니다"는 함정.

---

## 공통적으로 반복된 실수와 방침

1. **파일을 건드리면 곧바로 `tsc --noEmit`으로 확인.** JSX 중첩이나 decorator 관련 에러는 눈으로 안 보임.
2. **여러 탭에서 같은 컴포넌트 구조를 반복 렌더링하는 것은 공통 컴포넌트(`StatusBadge`)로 뽑는 게 훨씬 안정적.**
3. **"자동 파생 가능한 값은 저장하지 말고, 그 파생의 근거(= 실제 날짜)는 반드시 저장한다"** — 3번 항목의 재발 방지.
4. **포트 충돌 / stale 프로세스**는 개발 단계에서 제일 많은 시간을 잡아먹는다. `netstat -ano`를 체크 리스트에 포함.
5. **NestJS 컨트롤러에서 인터페이스 타입을 `@Body()` 데코레이터 시그니처에 직접 쓰지 말 것.** 인라인 구조체로 쓰거나 class DTO로 만들어야 `emitDecoratorMetadata`와 충돌하지 않는다.
