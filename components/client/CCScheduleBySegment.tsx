"use client";

import { useDevice } from "@/context/DeviceProvider";
import { category, saturday, SHOW_GSHEET_BUTTON, sunday } from "@/utils/constants";
import { formatDateLong } from "@/utils/helpers";
import CCVolunteerCell from './CCVolunteerCell';
import MCScheduleBySegment from './mobile/MCScheduleBySegment';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { postUpdateGoogleSheet } from '@/utils/apis/post';
import { useMemo } from 'react';
import { useSession } from 'next-auth/react';

interface Schedule {
  saturday: string
  sunday: string
  data: any
}

export default function CCScheduleBySegment({ schedule }: { schedule: Schedule }) {
  const { isMobile } = useDevice();
  const { data: session } = useSession();

  const hasUpdateGsheetPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(SHOW_GSHEET_BUTTON);
  }, [session]);

  const convertData = (data: any) => {
    const convertedData: any = {};
    data?.forEach((item: any) => {
      convertedData[item._id] = {};
      item.service.forEach((service: any) => {
        convertedData[item._id][service.role] = service;
      });
    });
    return convertedData;
  };

  const convertedData: any = convertData(schedule?.data);

  if (isMobile) {
    return <MCScheduleBySegment schedule={schedule} convertedData={convertedData} />;
  }

  const updateGoogleSheet = async () => {
    toast.info("Updating Byron's Google sheet. Please check the sheet for updates...", { autoClose: 5000 });
    await postUpdateGoogleSheet({saturday: schedule?.saturday, sunday: schedule?.sunday});
  }

  return (
    <div className='w-full rounded-t-xl rounded-b-lg overflow-hidden'>
      <div className="w-full overflow-x-auto">
        <table className="table-auto w-full min-w-[500px] xl:min-w-0">
          <thead>
            <tr>
              <th colSpan={7} className="text-white bg-slate-800 border border-slate-800 uppercase py-2">
                <div className='flex justify-between px-2.5'>
                  <div></div>
                  <div>{formatDateLong(schedule.saturday)} & {formatDateLong(schedule.sunday)}</div>
                  { hasUpdateGsheetPermission ?
                    <button onClick={updateGoogleSheet}>
                      <Image src="/gsheet-logo.png" width={24} height={24} className="md:w-[24px] md:h-[24px]" alt="logo" />
                    </button> :  <div></div>
                  }
                </div>
              </th>
            </tr>
            <tr className='h-0.5'></tr>
            <tr className='uppercase bg-slate-300 border-x border-slate-300 text-[10px] xl:text-sm'>
              <th colSpan={2} className="px-0.5 xl:px-1 py-1">Position</th>
              <th className="px-0.5 xl:px-1 py-1 text-zinc-600 border-x border-x-zinc-500"><span className="xl:hidden">Sat</span><span className="hidden xl:inline">Sat {saturday.FIRST_SERVICE}</span></th>
              <th className="px-0.5 xl:px-1 py-1"><span className="xl:hidden">9AM</span><span className="hidden xl:inline">Sun {sunday.FIRST_SERVICE}</span></th>
              <th className="px-0.5 xl:px-1 py-1"><span className="xl:hidden">12PM</span><span className="hidden xl:inline">Sun {sunday.SECOND_SERVICE}</span></th>
              <th className="px-0.5 xl:px-1 py-1"><span className="xl:hidden">3PM</span><span className="hidden xl:inline">Sun {sunday.THIRD_SERVICE}</span></th>
              <th className="px-0.5 xl:px-1 py-1"><span className="xl:hidden">6PM</span><span className="hidden xl:inline">Sun {sunday.FOURTH_SERVICE}</span></th>
            </tr>
          </thead>
          <tbody className='[&>tr.last-in-group]:border-b [&>tr.last-in-group]:border-b-black [&>tr.first-in-group]:border-t [&>tr.first-in-group]:border-t-black'>
            {category.ROLES.filter(role => role !== "audio core team").map((role, i) => {
              const satFirst = convertedData?.[category.SATURDAY_SERVICES[0]]?.[role]
              const sunFirst = convertedData?.[category.SUNDAY_SERVICES[0]]?.[role]
              const sunSecond = convertedData?.[category.SUNDAY_SERVICES[1]]?.[role]
              const sunThird = convertedData?.[category.SUNDAY_SERVICES[2]]?.[role]
              const sunFourth = convertedData?.[category.SUNDAY_SERVICES[3]]?.[role]
              const regexFirst = /^(foh)$/i;
              const regexLast = /^(foh observer|broadcast mix observer|audio volunteer 2|monitor mix observer|nxtgen observer)$/i;
              const isFirstInGroup = regexFirst.test(role)
              const isLastInGroup = regexLast.test(role)

              return (
                <tr key={i} data-group={role.slice(0, 3)} className={`${isLastInGroup && "last-in-group"} ${isFirstInGroup && "first-in-group"} border border-slate-300 bg-slate-100 odd:bg-slate-200`}>
                  <td className="w-4 xl:w-9 text-center h-4 xl:h-6 text-[10px] xl:text-xs">{i+1}</td>
                  <td className="px-0.5 xl:px-1 uppercase w-20 xl:w-52 text-[10px] xl:text-sm">{role.replace("broadcast", "bc").replace("monitor", "mon").replace(/\d+/g, "")}</td>
                  <CCVolunteerCell service={satFirst} isSaturday />
                  <CCVolunteerCell service={sunFirst} />
                  <CCVolunteerCell service={sunSecond} />
                  <CCVolunteerCell service={sunThird} />
                  <CCVolunteerCell service={sunFourth} />
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}