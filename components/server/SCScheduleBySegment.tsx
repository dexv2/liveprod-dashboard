import { getFilteredSchedule } from "@/utils/apis/get";
import { getNextService } from "@/utils/helpers";
import { checkAuth } from "@/utils/helpersServer";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BsArrowLeftCircle, BsArrowRightCircle } from "react-icons/bs";
import CCScheduleBySegment from "../client/CCScheduleBySegment";

export default async function SCScheduleBySegment({increment}: {increment: number}) {
  const isAdmin = await checkAuth();
  if (!isAdmin && increment !== 0) redirect("/schedule/segment/audio");

  const serviceDate = getNextService(increment);
  const nextServiceDate = getNextService(increment+1);
  const schedule1 = await getFilteredSchedule(serviceDate.saturday, serviceDate.sunday);
  const schedule2 = await getFilteredSchedule(nextServiceDate.saturday, nextServiceDate.sunday);

  return (
    <div className="flex justify-center">
      <div className="flex flex-col w-full gap-4 text-slate-700">
        <h1 className="text-2xl">
          Upcoming Schedule
        </h1>
        <div className="flex gap-0.5 w-full">
          <CCScheduleBySegment schedule={schedule1} />
          <CCScheduleBySegment schedule={schedule2} />
        </div>
        { isAdmin &&
          <div className="flex gap-3 w-full justify-end">
            <Link className="hover:bg-slate-800 hover:text-slate-50 rounded-full" href={`/schedule/segment/audio?increment=${increment-1}`}>
              <BsArrowLeftCircle size={27} />
            </Link>
            <Link className="hover:bg-slate-800 hover:text-slate-50 rounded-full" href={`/schedule/segment/audio?increment=${increment+1}`}>
              <BsArrowRightCircle size={27} />
            </Link>
          </div>
        }
      </div>
    </div>
  )
}
