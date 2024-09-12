import SCVolunteerCell from "@/components/server/SCVolunteerCell";
import { category, common } from "@/utils/constants";
import { formatDate, formatDateLong } from "@/utils/helpers";

interface Schedule {
  from: string
  to: string
  data: any
}

export default async function CCScheduleBySegment({ schedule }: { schedule: Schedule }) {
  const convertData = (data: any) => {
    const convertedData: any = {};
    data.forEach((item: any) => {
      convertedData[item._id] = {};
      item.service.forEach((service: any) => {
        convertedData[item._id][service.role] = service;
      });
    });
    return convertedData;
  };

  const convertedData: any = convertData(schedule.data);

  return (
    <div className="flex items-center justify-center w-full">
      <table className="table-auto border border-slate-500 w-full bg-gradient-to-br from-slate-200 to-gray-50">
        <thead>
          <tr>
            <th className="border-l border-slate-500 "></th>
            <th className=""></th>
            <th rowSpan={2} className="text-slate-200 border-l border-slate-500 bg-gradient-to-tr from-slate-400 to-slate-600">
              <div className="flex flex-col justify-between">
                <div>{formatDate(schedule.from)}</div>
                <div className="uppercase">{category.SATURDAY_SERVICE[0]}</div>
              </div>
            </th>
            <th rowSpan={2} colSpan={3} className="border-l border-slate-500 bg-gradient-to-tl from-emerald-400 via-teal-400 to-cyan-600">
              <div className="flex flex-col justify-between">
                <div>{formatDateLong(schedule.to)}</div>
                <div className="flex justify-around">
                  <div>{common.FIRST_SERVICE}</div>
                  <div>{common.SECOND_SERVICE}</div>
                  <div>{common.THIRD_SERVICE}</div>
                </div>
              </div>
            </th>
          </tr>
          <tr>
            <th className="border-l border-slate-500 "></th>
            <th className=""></th>
          </tr>
        </thead>
        <tbody>
          { category.ROLES.map((role, i) => {
            const sns = convertedData?.[category.SATURDAY_SERVICE[0]]?.[role]
            const firstService = convertedData?.[common.FIRST_SERVICE]?.[role]
            const secondService = convertedData?.[common.SECOND_SERVICE]?.[role]
            const thirdService = convertedData?.[common.THIRD_SERVICE]?.[role]

            return (
              <tr key={i} className="">
                <td className="border border-slate-500 w-9 text-center h-7">{i+1}</td>
                <td className="border border-slate-500 px-1 w-52 uppercase">{role.replace("broadcast", "bc")}</td>
                <SCVolunteerCell service={sns} />
                <SCVolunteerCell service={firstService} />
                <SCVolunteerCell service={secondService} />
                <SCVolunteerCell service={thirdService} />
              </tr>
            )})
          }
        </tbody>
      </table>
    </div>
  )
}
