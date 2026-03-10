import { getAllVolunteers } from '@/utils/apis/get';
import CCAddTraining from '../client/CCAddTraining';

export default async function SCAddTraining({ id }: { id: string }) {
  const volunteers = await getAllVolunteers();

  return <CCAddTraining volunteers={volunteers?.data || []} id={id} />;
}
