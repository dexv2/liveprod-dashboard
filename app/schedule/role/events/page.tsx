import SCEventsManager from "@/components/server/SCEventsManager";
import { auth } from "@/auth";
import { Suspense } from 'react';
import GCLoading from '@/components/global/GCLoading';

export default async function EventsPage() {
  const session = await auth();
  const isAuthenticated = !!(session?.user as any)?.username;

  return (
    <div className="w-full">
      <Suspense fallback={<GCLoading />}>
        <SCEventsManager isAuthenticated={isAuthenticated || false} />
      </Suspense>
    </div>
  );
}