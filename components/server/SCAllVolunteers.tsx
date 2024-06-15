import dynamic from 'next/dynamic';
import { getAllVolunteers } from '@/utils/apis/get';
import { checkAuth } from '@/utils/helpers';
const CCAllVolunteers = dynamic(() => import('@/components/client/CCAllVolunteers'), {ssr: false});

export default async function SCAllVolunteers() {
  const volunteers = await getAllVolunteers();
  const isAuthenticated = await checkAuth();

	return (
    <CCAllVolunteers data={volunteers.data} isAdmin={isAuthenticated} />
	)
}
