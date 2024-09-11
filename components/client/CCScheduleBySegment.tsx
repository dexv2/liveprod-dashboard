import SCVolunteerCell from "@/components/server/SCVolunteerCell";
import { category, common } from "@/utils/constants";
import { formatDate } from "@/utils/helpers";

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
      <table className="table-auto border border-slate-500 w-full bg-slate-300">
        <thead>
          <tr>
            <th className="border-l border-slate-500 bg-slate-100"></th>
            <th className="bg-slate-100"></th>
            <th className="border-l border-slate-500">{formatDate(schedule.from)}</th>
            <th className="border-l border-slate-500 bg-green-400">{formatDate(schedule.to)}</th>
            <th className="border-l border-slate-500 bg-green-400">{formatDate(schedule.to)}</th>
            <th className="border-l border-slate-500 bg-green-400">{formatDate(schedule.to)}</th>
          </tr>
          <tr>
            <th className="border-l border-slate-500 bg-slate-100"></th>
            <th className="bg-slate-100"></th>
            <th className="border-l border-slate-500 uppercase">{category.SATURDAY_SERVICE[0]}</th>
            <th className="border-l border-slate-500 bg-green-400 uppercase">{common.FIRST_SERVICE}</th>
            <th className="border-l border-slate-500 bg-green-400 uppercase">{common.SECOND_SERVICE}</th>
            <th className="border-l border-slate-500 bg-green-400 uppercase">{common.THIRD_SERVICE}</th>
          </tr>
        </thead>
        <tbody>
          { category.ROLES.map((role, i) => {
            const sns = convertedData?.[category.SATURDAY_SERVICE[0]]?.[role]
            const firstService = convertedData?.[common.FIRST_SERVICE]?.[role]
            const secondService = convertedData?.[common.SECOND_SERVICE]?.[role]
            const thirdService = convertedData?.[common.THIRD_SERVICE]?.[role]

            return (
              <tr key={i} className="bg-slate-100">
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
