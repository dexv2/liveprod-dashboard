import { category, common } from "@/utils/constants";
import { formatDate, getMonth } from "@/utils/helpers";
import { redirect } from "next/navigation";
import { Fragment } from "react";
import VolunteerCell from "./VolunteerCell";
import RoleDropdown from "./RoleDropdown";
import { getSchedulesByRole } from "@/utils/apis/get";

export default async function SchedulesByRole({role}: {role: string}) {
  if (!category.ROLES.includes(role)) {
    redirect("/");
  }

  const res = await getSchedulesByRole(role);
  const service: any = {};
  for (let i = 0; i < res.data.length; i++) {
    const schedule = res.data[i];
    service[schedule._id] = schedule.service;
  }

  return (
    <Fragment>
      <table className="table-auto border w-3/5 bg-slate-300">
        <thead>
          <tr className="bg-slate-900 border border-slate-500">
            <RoleDropdown role={role} />
          </tr>
          <tr>
            <th className="border-l border-slate-500"></th>
            <th className="border-y border-slate-500"></th>
            { service?.[category.SATURDAY_SERVICE]?.length &&
              <Fragment>
                <th className="border border-slate-500 uppercase">{category.SATURDAY_SERVICE}</th>
                <th className="border border-slate-500"></th>
              </Fragment>
            }
            <th className="border border-slate-500 uppercase">{common.FIRST_SERVICE}</th>
            <th className="border border-slate-500 uppercase">{common.SECOND_SERVICE}</th>
            <th className="border border-slate-500 uppercase">{common.THIRD_SERVICE}</th>
          </tr>
        </thead>
        <tbody>
          { service[common.FIRST_SERVICE].map((firstService: any, i: number) => {
            const sns = service?.[category.SATURDAY_SERVICE];
            const secondService = service[common.SECOND_SERVICE][i];
            const thirdService = service[common.THIRD_SERVICE][i];

            let displayMonth;
            if (i === 0 || getMonth(firstService.date) !== getMonth(service[common.FIRST_SERVICE][i-1]?.date)) {
              displayMonth = getMonth(firstService.date);
            } else {
              displayMonth = ""
            }
            return (
              <tr key={firstService.date}>
                <td className="border border-slate-500 bg-slate-100 w-24">{displayMonth}</td>
                { sns?.length &&
                  <Fragment>
                    <td className="border border-slate-500 bg-slate-100 w-24">{formatDate(sns[i].date)}</td>
                    <VolunteerCell service={sns?.[i]} />
                  </Fragment>
                }
                <td className="border border-slate-500 bg-slate-100 w-24">{formatDate(firstService.date)}</td>
                <VolunteerCell service={firstService} />
                <VolunteerCell service={secondService} />
                <VolunteerCell service={thirdService} />
              </tr>
            )})
          }
        </tbody>
      </table>
    </Fragment>
  );
}
