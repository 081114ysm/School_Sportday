// 서버 컴포넌트: 서버에서 경기 목록을 가져와 클라이언트의 요일 탭 UI에 전달한다.
import { fetchMatches } from '@/services/api';
import ScheduleClient from '@/components/schedule/ScheduleClient';

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
  const initial = await fetchMatches().catch(() => []);
  return <ScheduleClient initial={initial} />;
}
