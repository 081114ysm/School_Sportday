# Q05 작업 지시 근거

2026-11-06 사용자 지시:

- 공개 `School_Sportday` 저장소를 별도 작업 공간에 복제한다.
- Q05의 `updateScore()` 또는 `updateSetScore()`에 실제 데이터베이스 transaction을 적용한다.
- 정상 저장과 ScoreLog 저장 실패 rollback 테스트를 작성하고 실행한다.
- 실행 결과와 미실행 범위를 구분해 Q05 답변을 작성한다.
- 작업 브랜치를 GitHub에 push한다.

이번 구현 범위는 Match와 ScoreLog의 원자적 저장이며, 동시성 제어·운영 배포·브라우저 UI 변경은 제외한다.
