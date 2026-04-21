// 백엔드 기본 URL의 단일 출처. 서버·클라이언트 컴포넌트 모두에서 동작한다.
// `NEXT_PUBLIC_` 접두사로 빌드 시 인라인된다.
export const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.rlarngus.club';
