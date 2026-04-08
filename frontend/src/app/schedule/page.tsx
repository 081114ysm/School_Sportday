// Server component: fetches match list on the server and passes it to the
// interactive day-tab UI on the client.
import { fetchMatches } from '@/lib/api';
import ScheduleClient from './ScheduleClient';

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
  const initial = await fetchMatches().catch(() => []);
  return <ScheduleClient initial={initial} />;
}
