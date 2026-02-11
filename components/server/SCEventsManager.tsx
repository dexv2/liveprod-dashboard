import { getAllUpcomingEvents, getAllVolunteers } from '@/utils/apis/get';
import CCEventsManager from '../client/CCEventsManager';

export default async function SCEventsManager() {
  const events = await getAllUpcomingEvents();
  const volunteers = await getAllVolunteers();

  return <CCEventsManager events={events?.data || []} volunteers={volunteers?.data || []} />;
}
