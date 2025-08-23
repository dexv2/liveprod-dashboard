import { getSchduleByDateRange } from "@/utils/apis/get";
import { getNextService } from "@/utils/helpers";
import Link from "next/link";
import { BsArrowLeftCircle, BsArrowRightCircle } from "react-icons/bs";
import CCScheduleBySegment from "../client/CCScheduleBySegment";
import GCTabLInk from '../global/tabs/GCTabLink';

export default async function SCScheduleBySegment({increment, service}: {increment: number, service: string}) {
  const serviceDate = getNextService(increment);
  const nextServiceDate = getNextService(increment+1);
  const schedule1 = await getSchduleByDateRange(serviceDate.saturday, serviceDate.sunday);
  const schedule2 = await getSchduleByDateRange(nextServiceDate.saturday, nextServiceDate.sunday);

  return (
    <div className="flex justify-center">
      <div className="flex flex-col w-full gap-2 text-slate-700">
        <div className='flex items-center justify-end'>
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
        <div className='absolute bottom-4 left-0 w-full px-4'>
          <div className=''>
            <div className="flex justify-between">
              <Link className="text-slate-600 hover:underline" href={`/schedule/segment/audio/${service}?increment=${increment-1}`}>
                <div className='flex gap-2 items-center'>
                  <BsArrowLeftCircle size={22} />
                  <p>Prev Week</p>
                </div>
              </Link>
              <Link className="text-slate-600 hover:underline" href={`/schedule/segment/audio/${service}?increment=${increment+1}`}>
                <div className='flex gap-2 items-center'>
                <p>Next Week</p>
                <BsArrowRightCircle size={22} />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
