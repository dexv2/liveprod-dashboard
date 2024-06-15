import GCLoading from "@/components/global/GCLoading";
import SCAllVolunteers from '@/components/server/SCAllVolunteers';
import { Suspense } from 'react';

export default function AllVolunteers() {
	return (
    <Suspense fallback={<GCLoading />}>
      <SCAllVolunteers />
    </Suspense>
	)
}
