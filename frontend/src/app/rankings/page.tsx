// Server component: fetches rankings during SSR and hands the data to the
// client-side filter/tab UI. No hooks here — keeps the network call off the
// browser's critical path.
import { fetchRankings } from '@/lib/api';
import RankingsClient from './RankingsClient';

export const dynamic = 'force-dynamic';

export default async function RankingsPage() {
  const initial = await fetchRankings().catch(() => []);
  return <RankingsClient initial={initial} />;
}
