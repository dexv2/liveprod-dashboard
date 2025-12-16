import { auth } from "@/auth";
import CCAnnouncementBanner from "@/components/client/CCAnnouncementBanner";
import { getSchduleByDateRange } from "@/utils/apis/get";
import { getNextService } from "@/utils/helpers";
import Link from "next/link";
import { BsArrowLeftCircle, BsArrowRightCircle } from "react-icons/bs";
import CCMergedScheduleBySegment from "@/components/client/CCMergedScheduleBySegment";
import CCScheduleBySegment from "@/components/client/CCScheduleBySegment";
import GCTabLInk from '@/components/global/tabs/GCTabLink';
import { PiLegoSmiley, PiLegoSmileyDuotone } from "react-icons/pi"

export default async function Home({searchParams}: {searchParams: {increment?: string, service?: string}}) {
  const session = await auth();
  const user = session?.user?.username || "guest";
  const isAuthenticated = (session?.user as any)?.isAdmin;
  const increment = parseInt(searchParams?.increment || "0");
  const service = searchParams?.service || "regular";
  
  const serviceDate1 = getNextService(increment);
  const serviceDate2 = getNextService(increment+1);
  const schedule1 = await getSchduleByDateRange(serviceDate1.saturday, serviceDate1.sunday);
  const schedule2 = await getSchduleByDateRange(serviceDate2.saturday, serviceDate2.sunday);

  return (
    <>
      <CCAnnouncementBanner />
      <div className="flex flex-col gap-6 md:gap-12 px-2 md:px-4">
        <div className="flex gap-2 md:gap-3 text-white opacity-60 justify-center text-center">
          <PiLegoSmileyDuotone size={20} className="md:w-[27px] md:h-[27px] flex-shrink-0" />
          <div className="flex flex-col justify-center text-sm md:text-lg">
            <div>
              Hello, <span className="capitalize">{user}</span>! Welcome to Live Production Dashboard
            </div>
          </div>
          <PiLegoSmiley size={20} className="md:w-[27px] md:h-[27px] flex-shrink-0" />
        </div>
        
        <div className="flex justify-center px-1 md:px-4">
          <div className="flex flex-col w-full gap-4 text-slate-700">
            <div className='flex items-center justify-end mb-6'>
              <GCTabLInk
                links={[
                  `/?increment=${increment}&service=regular`,
                  `/?increment=${increment}&service=events`
                ]}
                name={["regular", "events"]}
                labels={["Regular Service", "Events"]}
                isSinglePath
              />
            </div>
            <div>
              {service === 'events' ? (
                <div className="mt-[0.5px]">
                  <CCScheduleBySegment schedule={{saturday: '', sunday: '', data: []}} dayService={service} isAuthenticated={isAuthenticated} isCompact={false} />
                </div>
              ) : (
                <div className="flex flex-col xl:flex-row gap-2 xl:gap-4 w-full mt-[0.5px]">
                  <CCMergedScheduleBySegment schedule={schedule1} isAuthenticated={isAuthenticated} />
                  <CCMergedScheduleBySegment schedule={schedule2} isAuthenticated={isAuthenticated} />
                </div>
              )}
            </div>
            {service !== 'events' && (
              <div className='mt-4 mb-8'>
                <div className="flex justify-between px-2">
                  <Link className="text-slate-600 hover:underline" href={`/?increment=${increment-1}&service=${service}`}>
                    <div className='flex gap-1 md:gap-2 items-center'>
                      <BsArrowLeftCircle size={18} className="md:w-[22px] md:h-[22px]" />
                      <p className="text-sm md:text-base">Prev Week</p>
                    </div>
                  </Link>
                  <Link className="text-slate-600 hover:underline" href={`/?increment=${increment+1}&service=${service}`}>
                    <div className='flex gap-1 md:gap-2 items-center'>
                    <p className="text-sm md:text-base">Next Week</p>
                    <BsArrowRightCircle size={18} className="md:w-[22px] md:h-[22px]" />
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}