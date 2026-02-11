export const dynamic = "force-dynamic";

import SCEventsManager from "@/components/server/SCEventsManager";
import { Suspense } from 'react';
import GCLoading from '@/components/global/GCLoading';

export default async function EventsPage() {
  return (
    <div className="w-full">
      <Suspense fallback={<GCLoading />}>
        <SCEventsManager />
      </Suspense>
    </div>
  );
}