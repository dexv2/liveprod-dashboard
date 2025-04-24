import { getFilteredSchedule } from "@/utils/apis/get";
import { getNextService } from "@/utils/helpers";
import { checkAuth } from "@/utils/helpersServer";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BsArrowLeftCircle, BsArrowRightCircle } from "react-icons/bs";
import CCScheduleBySegment from "../client/CCScheduleBySegment";
import GCTabLInk from '../global/tabs/GCTabLink';

export default async function SCScheduleBySegment({increment, service}: {increment: number, service: string}) {
  const isAdmin = await checkAuth();
  if (!isAdmin && increment !== 0) redirect("/schedule/segment/audio/sunday");

  const serviceDate = getNextService(increment);
  const nextServiceDate = getNextService(increment+1);
  const schedule1 = await getFilteredSchedule(serviceDate.saturday, serviceDate.sunday);
  const schedule2 = await getFilteredSchedule(nextServiceDate.saturday, nextServiceDate.sunday);

  return (
    <div className="flex justify-center">
      <div className="flex flex-col w-full gap-4 text-slate-700">
        <div className='flex items-center justify-between'>
          <h1 className="text-2xl">
            
          </h1>
          <GCTabLInk
            links={[
              `/schedule/segment/audio/saturday?increment=${increment}`,
              `/schedule/segment/audio/sunday?increment=${increment}`
            ]}
            name={["saturday", "sunday"]}
            labels={["Saturday", "Sunday"]}
            isSinglePath
          />
        </div>
        <div>
          <div className="flex gap-2 w-full mt-[0.5px]">
            <CCScheduleBySegment schedule={schedule1} dayService={service} />
            <CCScheduleBySegment schedule={schedule2} dayService={service} />
          </div>
        </div>
        { isAdmin &&
          <div className='absolute right-3.5 bottom-2'>
            <div className="flex gap-3 w-full justify-end">
              <Link className="text-slate-600 hover:bg-slate-600 hover:text-slate-50 rounded-full" href={`/schedule/segment/audio/${service}?increment=${increment-1}`}>
                <BsArrowLeftCircle size={27} />
              </Link>
              <Link className="text-slate-600 hover:bg-slate-600 hover:text-slate-50 rounded-full" href={`/schedule/segment/audio/${service}?increment=${increment+1}`}>
                <BsArrowRightCircle size={27} />
              </Link>
            </div>
          </div>
        }
      </div>
    </div>
  )
}
