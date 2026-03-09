export const dynamic = "force-dynamic";
import CCEventsManager from '@/components/client/CCEventsManager';

export default async function EventsPage() {
  return (
    <div className="w-full">
      <CCEventsManager />
    </div>
  );
}