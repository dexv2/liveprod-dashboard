"use client";

import { useDevice } from "@/components/global/DeviceProvider";
import { category, saturday, sunday } from "@/utils/constants";
import { formatDateLong } from "@/utils/helpers";
import CCVolunteerCell from './CCVolunteerCell';
import MCScheduleBySegment from './mobile/MCScheduleBySegment';

interface Schedule {
  saturday: string
  sunday: string
  data: any
}

export default function CCScheduleBySegment({ schedule, isAuthenticated = false }: { schedule: Schedule, isAuthenticated: boolean }) {
  const { isMobile } = useDevice();
  
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
    return <MCScheduleBySegment schedule={schedule} convertedData={convertedData} isAuthenticated={isAuthenticated} />;
  }

  return (
    <div className='w-full rounded-t-xl rounded-b-lg overflow-hidden'>
      <div className="w-full overflow-x-auto">
        <table className="table-auto w-full min-w-[500px] xl:min-w-0">
          <thead>
            <tr>
              <th colSpan={7} className="text-white bg-slate-800 border border-slate-800 uppercase py-2">
                {formatDateLong(schedule.saturday)} & {formatDateLong(schedule.sunday)}
              </th>
            </tr>
            <tr className='h-0.5'></tr>
            <tr className='uppercase bg-slate-300 border-t border-x border-slate-300 text-[10px] xl:text-sm'>
              <th colSpan={2} className="px-0.5 xl:px-1 py-1">Position</th>
              <th className="px-0.5 xl:px-1 py-1"><span className="xl:hidden">Sat</span><span className="hidden xl:inline">Sat {saturday.FIRST_SERVICE}</span></th>
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
                  <CCVolunteerCell service={satFirst} isAuthenticated={isAuthenticated} />
                  <CCVolunteerCell service={sunFirst} isAuthenticated={isAuthenticated} />
                  <CCVolunteerCell service={sunSecond} isAuthenticated={isAuthenticated} />
                  <CCVolunteerCell service={sunThird} isAuthenticated={isAuthenticated} />
                  <CCVolunteerCell service={sunFourth} isAuthenticated={isAuthenticated} />
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}