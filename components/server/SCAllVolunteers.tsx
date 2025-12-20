import dynamic from 'next/dynamic';
import { getAllVolunteers } from '@/utils/apis/get';
import { checkAdminAuth } from '@/utils/helpersServer';
import GCLoading from '../global/GCLoading';
const CCAllVolunteers = dynamic(() => import('@/components/client/CCAllVolunteers'), {
  ssr: false,
  loading: () => <GCLoading />
});

export default async function SCAllVolunteers() {
  const volunteers = await getAllVolunteers();
  const isAdmin = await checkAdminAuth();

  // Handle case where volunteers data might be undefined or have errors
  const volunteerData = volunteers?.data || [];

	return (
    <CCAllVolunteers data={volunteerData} isAdmin={isAdmin} />
	)
}
