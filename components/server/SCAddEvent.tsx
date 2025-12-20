import { getAllVolunteers, getEventById } from '@/utils/apis/get';
import CCAddEvent from '../client/CCAddEvent';

export default async function SCAddEvent({ id }: { id: string }) {
  const volunteers = await getAllVolunteers();
  let event = null;
  if (id !== 'new') {
    const response = await getEventById(id);
    event = response?.event || null;
  }

  return <CCAddEvent volunteers={volunteers?.data || []} event={event} />;
}
