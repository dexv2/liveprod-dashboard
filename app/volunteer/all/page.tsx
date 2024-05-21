import dynamic from 'next/dynamic';
import { getAllVolunteers } from '@/utils/apis/get';
const AllVolunteers = dynamic(() => import('@/components/AllVolunteers'), {ssr: false});

export default async function Page() {
  const volunteers = await getAllVolunteers();

	return (
    <div className="flex justify-center">
      <div className="w-3/4">
        <h2>Volunteers List</h2>
        <AllVolunteers data={volunteers.data} />
      </div>
    </div>
	);
};
