import { getSchduleByDateRange } from "@/utils/apis/get";
import { getNextService } from "@/utils/helpers";
import { auth } from "@/auth";
import CCScheduleBySegment from "../client/CCScheduleBySegment";
import GCTabLInk from '../global/tabs/GCTabLink';
import GCLoading from '../global/GCLoading';
import { Suspense } from 'react';
import SCEventsManager from './SCEventsManager';
import CCScheduleNavigation from '../client/CCScheduleNavigation';

export default async function SCScheduleBySegment({increment, service}: {increment: number, service: string}) {
  const session = await auth();
  const isAuthenticated = (session?.user as any)?.isAdmin;
  const serviceDate1 = getNextService(increment);
  const serviceDate2 = getNextService(increment+1);
  const schedule1 = await getSchduleByDateRange(serviceDate1.saturday, serviceDate1.sunday);
  const schedule2 = await getSchduleByDateRange(serviceDate2.saturday, serviceDate2.sunday);

  return (
    <div className="flex justify-center px-1 md:px-4">
      <div className="flex flex-col w-full gap-4 text-slate-700">
        <div className='flex items-center justify-end mb-6'>
          <GCTabLInk
            queryParams={[
              `?increment=${increment}&service=regular`,
              `?increment=${increment}&service=events`
            ]}
            name={["regular", "events"]}
            labels={["Regular Service", "Events"]}
            isSinglePath
          />
        </div>
        {service !== 'events' && (
          <CCScheduleNavigation increment={increment} />
        )}
        <div>
          {service === 'events' ? (
            <div className="mt-[0.5px]">
              <div className='w-full rounded-t-xl rounded-b-lg overflow-hidden'>
                <Suspense fallback={<GCLoading />}>
                  <SCEventsManager isAuthenticated={isAuthenticated || false} />
                </Suspense>
              </div>
            </div>
          ) : (
            <div className="flex flex-col xl:flex-row gap-2 xl:gap-4 w-full mt-[0.5px]">
              <CCScheduleBySegment schedule={schedule1} isAuthenticated={isAuthenticated} />
              <CCScheduleBySegment schedule={schedule2} isAuthenticated={isAuthenticated} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
