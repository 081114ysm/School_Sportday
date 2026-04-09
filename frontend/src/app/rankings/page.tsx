// 서버 컴포넌트: SSR 시 랭킹 데이터를 가져와 클라이언트 필터/탭 UI에 전달한다.
// 훅 없음 — 네트워크 요청을 브라우저 크리티컬 패스에서 제외한다.
import { fetchRankings } from '@/services/api';
import RankingsClient from '@/components/rankings/RankingsClient';

export const dynamic = 'force-dynamic';

export default async function RankingsPage() {
  const initial = await fetchRankings().catch(() => []);
  return <RankingsClient initial={initial} />;
}
