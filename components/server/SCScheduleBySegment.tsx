import SCVolunteerCell from "@/components/server/SCVolunteerCell";
import { getFilteredSchedule } from "@/utils/apis/get";
import { category, common } from "@/utils/constants";
import { checkAuth, formatDate, getNextService } from "@/utils/helpers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BsArrowLeftCircle, BsArrowRightCircle } from "react-icons/bs";

export default async function SCScheduleBySegment({increment}: {increment: number}) {
  const isAdmin = await checkAuth();
  if (!isAdmin && increment !== 0) redirect("/schedule/segment/audio");

  const serviceDate = getNextService(increment);
  const res = await getFilteredSchedule(serviceDate.saturday, serviceDate.sunday);

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

  const convertedData: any = convertData(res.data);

  return (
    <div className="flex justify-center">
      <div className="flex flex-col w-5/6 gap-4 text-slate-700">
        <h1 className="text-2xl">
          Upcoming Schedule
        </h1>
        <div className="flex items-center justify-center">
          <table className="table-auto border border-slate-500 w-full bg-slate-300">
            <thead>
              <tr>
                <th className="border-l border-slate-500 bg-slate-100"></th>
                <th className="bg-slate-100"></th>
                <th className="border-l border-slate-500">{formatDate(res.from)}</th>
                <th className="border-l border-slate-500 bg-green-400">{formatDate(res.to)}</th>
                <th className="border-l border-slate-500 bg-green-400">{formatDate(res.to)}</th>
                <th className="border-l border-slate-500 bg-green-400">{formatDate(res.to)}</th>
              </tr>
              <tr>
                <th className="border-l border-slate-500 bg-slate-100"></th>
                <th className="bg-slate-100"></th>
                <th className="border-l border-slate-500 uppercase">{category.SATURDAY_SERVICE}</th>
                <th className="border-l border-slate-500 bg-green-400 uppercase">{common.FIRST_SERVICE}</th>
                <th className="border-l border-slate-500 bg-green-400 uppercase">{common.SECOND_SERVICE}</th>
                <th className="border-l border-slate-500 bg-green-400 uppercase">{common.THIRD_SERVICE}</th>
              </tr>
            </thead>
            <tbody>
              { category.ROLES.map((role, i) => {
                const sns = convertedData?.[category.SATURDAY_SERVICE]?.[role]
                const firstService = convertedData?.[common.FIRST_SERVICE]?.[role]
                const secondService = convertedData?.[common.SECOND_SERVICE]?.[role]
                const thirdService = convertedData?.[common.THIRD_SERVICE]?.[role]

                return (
                  <tr key={i}>
                    <td className="border border-slate-500 bg-slate-100 w-9 text-center h-8">{i}</td>
                    <td className="border border-slate-500 bg-slate-100 px-1 w-64 uppercase">{role}</td>
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
