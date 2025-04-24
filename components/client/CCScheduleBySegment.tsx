import SCVolunteerCell from "@/components/server/SCVolunteerCell";
import { category, saturday, service, sunday } from "@/utils/constants";
import { formatDateLong } from "@/utils/helpers";
import { Fragment, useMemo } from 'react';

interface Schedule {
  saturday: string
  sunday: string
  data: any
}

export default function CCScheduleBySegment({ schedule, dayService }: { schedule: Schedule, dayService: string }) {
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

  const roles = useMemo(() => (
    dayService === service.SATURDAY ? category.SNS_ROLES : category.ROLES
  ), [dayService])

  return (
    <div className='w-full rounded-t-xl rounded-b-lg overflow-hidden'>
      <div className="flex items-center justify-center w-full">
        <table className="table-auto w-full">
          <thead>
            { dayService === service.SATURDAY ?
              <Fragment>
                <tr>
                  <th colSpan={4} className="text-white bg-slate-800 border border-slate-800 uppercase py-2">{formatDateLong(schedule.saturday)}</th>
                </tr>
                <tr className='h-0.5'></tr>
                <tr className='uppercase bg-slate-300 border-t border-x border-slate-300'>
                  <th colSpan={2}>{service.SATURDAY}</th>
                  <th>{saturday.FIRST_SERVICE}</th>
                  <th>{saturday.SECOND_SERVICE}</th>
                </tr>
              </Fragment> :
              <Fragment>
                <tr>
                  <th colSpan={6} className="text-white bg-slate-800 border border-slate-800 uppercase py-2">{formatDateLong(schedule.sunday)}</th>
                </tr>
                <tr className='h-0.5'></tr>
                <tr className='uppercase bg-slate-300 border-t border-x border-slate-300'>
                  <th colSpan={2}>{service.SUNDAY}</th>
                  <th>{sunday.FIRST_SERVICE}</th>
                  <th>{sunday.SECOND_SERVICE}</th>
                  <th>{sunday.THIRD_SERVICE}</th>
                  <th>{sunday.FOURTH_SERVICE}</th>
                </tr>
              </Fragment>
            }
          </thead>
          <tbody className='[&>tr.last-in-group]:border-b [&>tr.last-in-group]:border-b-black [&>tr.first-in-group]:border-t [&>tr.first-in-group]:border-t-black'>
            { roles.map((role, i) => {
              const snsFirst = convertedData?.[category.SATURDAY_SERVICES[0]]?.[role]
              const snsSecond = convertedData?.[category.SATURDAY_SERVICES[1]]?.[role]
              const firstService = convertedData?.[category.SUNDAY_SERVICES[0]]?.[role]
              const secondService = convertedData?.[category.SUNDAY_SERVICES[1]]?.[role]
              const thirdService = convertedData?.[category.SUNDAY_SERVICES[2]]?.[role]
              const fourthService = convertedData?.[category.SUNDAY_SERVICES[3]]?.[role]
              const regexFirst = /^(foh)$/i;
              const regexLast = /^(foh observer 2|broadcast mix observer|audio volunteer 2|monitor mix observer|nxtgen observer)$/i;
              const isFirstInGroup = regexFirst.test(role)
              const isLastInGroup = regexLast.test(role)

              return (
                <tr key={i} data-group={role.slice(0, 3)} className={`${isLastInGroup && "last-in-group"} ${isFirstInGroup && "first-in-group"} border border-slate-300 bg-slate-100 odd:bg-slate-200`}>
                  <td className="w-9 text-center h-6 text-xs">{i+1}</td>
                  {/* str.replace(/\d+/g, "") removes numbers in name */}
                  <td className="px-1 w-52 uppercase text-sm">{role.replace("broadcast", "bc").replace(/\d+/g, "")}</td>
                  { dayService === service.SATURDAY ?
                    <>
                      <SCVolunteerCell service={snsFirst} />
                      <SCVolunteerCell service={snsSecond} />
                    </> :
                    <>
                      <SCVolunteerCell service={firstService} />
                      <SCVolunteerCell service={secondService} />
                      <SCVolunteerCell service={thirdService} />
                      <SCVolunteerCell service={fourthService} />
                    </>
                  }
                </tr>
              )})
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
