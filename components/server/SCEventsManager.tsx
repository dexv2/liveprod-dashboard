import { getAllEvents, getAllVolunteers } from '@/utils/apis/get';
import CCEventsManager from '../client/CCEventsManager';

export default async function SCEventsManager({ isAuthenticated }: { isAuthenticated: boolean }) {
  const events = await getAllEvents();
  const volunteers = await getAllVolunteers();

  return <CCEventsManager isAuthenticated={isAuthenticated} events={events?.data || []} volunteers={volunteers?.data || []} />;
}
