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

> ### 1. Socket.IO 기반 실시간 스코어보드
>
> - 서버 → 전체 클라이언트 실시간 점수 전파 구조
> - 싱글턴 패턴으로 소켓 인스턴스 관리, 중복 연결 방지
> - 지수 백오프 기반 무한 재연결

---

> ### 2. 관리자 점수 입력 시스템
>
> - 실시간 +/- 점수 조정, ScoreLog 기반 Undo
> - 멀티 세트 종목(배구·배드민턴) — 듀스 규칙 포함, `setsJson` JSON 직렬화 저장
> - `scoreA/scoreB` 편집 시 `setsJson` 자동 동기화
> - 401 수신 → `dispatchEvent` → 자동 재인증 복귀

---

> ### 3. 일정 / 순위 / 토너먼트 페이지
>
> - 경기 일정표 — 요일 탭, 시간대별 타임라인, 완료 경기 자동 제외
> - 순위표 — 학년·팀별 탭, 소켓 실시간 갱신, 학년반→클럽팀 승점 자동 귀속
> - 토너먼트 대진 — 준결승 승자 결승 카드 자동 반영, 결승 생성 시 승자만 선택 가능
> - 여자연합(AC·BD) 경기 결과를 구성팀에 귀속, 연합팀 자체는 순위표 제외

---

> ### 4. PWA Web Push 알림
>
> - Service Worker `push` 이벤트 핸들러, 백그라운드 알림
> - VAPID 키 자동 생성·영속 저장, 죽은 구독 자동 정리
> - 권한 요청 → 공개 키 수신 → 구독 → 서버 등록 4단계 처리

---

> ### 5. 백엔드 설계 및 구현
>
> - NestJS 11 + TypeORM RESTful API 전체 설계
> - SQLite(로컬) / PostgreSQL(Railway) 환경별 자동 선택
> - `ScoreLog` 엔티티로 점수 변경 이력 관리
> - `OnModuleInit` + `setInterval` — 부팅 시 1회 + 10분 주기 과거 경기 자동 DONE 처리

---

# 문제 발견 및 해결방안

---

> ## 날짜 없는 스키마로 자동 상태 전환 불가
>
> ### 원인
> 한 주짜리 단기 이벤트라고 가정하고 요일(`월`, `화`…)만 저장한 설계 미스. 실제 날짜가 없어 `matchDate < today` 같은 날짜 비교 자체가 불가능했고, 주차 매핑을 코드에 하드코딩해야 했다.
>
> ### 해결
> `Match` 엔티티에 `matchDate: string | null` (ISO `YYYY-MM-DD`) 컬럼을 추가하고, 관리자 폼의 요일 select를 날짜 input으로 교체. 저장 시 요일 라벨은 날짜에서 자동 파생해 기존 UI 호환을 유지.

---

> ## 관리자가 접속해야만 상태가 동기화되는 문제
>
> ### 원인
> 경기 상태 동기화 책임이 프론트엔드 `loadData()`에 묶여 있어, 관리자가 접속하지 않으면 날짜가 지난 경기가 "예정"으로 계속 표시되는 구조.
>
> ### 해결
> `MatchesService`에 `OnModuleInit`을 구현해 서버 부팅 시 1회 + 10분 주기 `setInterval`로 과거 경기를 자동 DONE 처리. 외부 의존성 없이 표준 `setInterval`만 사용.

---

> ## DB 상태와 실제 날짜가 불일치하는 표시 오류
>
> ### 원인
> `match.status`가 DB에 저장된 정적인 값이라 실제 시간 흐름을 반영하지 못함. 날짜가 지나도 상태가 자동 갱신되지 않아 관리자·사용자 모두에게 잘못된 상태가 표시됨.
>
> ### 해결
> `effectiveStatus(match)` 헬퍼를 구현해 `matchDate`와 오늘 날짜를 비교한 파생 상태를 동적으로 계산. 프론트·백엔드 양쪽에서 이중으로 보완 적용.

---

> ## PWA 푸시 알림이 코드만 있고 실제로 동작하지 않는 문제
>
> ### 원인
> Service Worker에 `push` 이벤트 핸들러가 누락되어 있고, VAPID 키·`web-push` 라이브러리·`PushSubscription` 저장소 등 푸시 인프라 전체가 미구현 상태였음.
>
> ### 해결
> Service Worker에 `push` / `notificationclick` 핸들러 추가 → VAPID 키 자동 생성 및 영속 저장 → `PushSubscription` 엔티티 추가 순서로 레이어별 순차 해결. NestJS decorator metadata 충돌(`TS1272`)은 `@Body()` 타입을 인라인 객체로 교체해 우회.

---

> ## 세트제 종목 직접 편집 시 토너먼트·순위에 결과가 반영되지 않는 문제
>
> ### 원인
> 관리자가 `scoreA/scoreB`를 직접 수정해도 백엔드 `update()`가 `setsJson`을 갱신하지 않음. 토너먼트 승자 판정과 점수 표시는 세트제 종목에 대해 `setsJson`의 세트 승수를 읽기 때문에 실제 점수와 표시가 불일치.
>
> ### 해결
> 백엔드 `update()` 메서드에 `setsJson` 자동 동기화 블록 추가. `isMultiSetSport(sport)` + `scoreA/scoreB` 변경 감지 시 세트 배열을 역산해 `setsJson`을 재생성.

---

> ## 관리자 페이지와 사용자 페이지 디자인 이질감
>
> ### 원인
> `admin.module.css`가 `.adminPage` 스코프에서 자체 CSS 변수(`--bg`, `--accent` 등)를 정의해 전역 팔레트와 완전히 독립적으로 동작. 초기 개발 시 스타일 분리가 무계획적으로 진행된 결과.
>
> ### 해결
> `.adminPage`의 CSS 변수 블록을 전역 팔레트와 동일한 값으로 일괄 교체. 변수 블록 한 곳만 수정해 관리자 UI 전체 톤 통일.
