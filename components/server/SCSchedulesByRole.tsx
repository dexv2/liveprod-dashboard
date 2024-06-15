import { category, common } from "@/utils/constants";
import { formatDate } from "@/utils/helpers";
import { redirect } from "next/navigation";
import { Fragment } from "react";
import SCVolunteerCell from "@/components/server/SCVolunteerCell";
import RoleDropdown from "@/components/client/CCRoleDropdown";
import { getSchedulesByRole } from "@/utils/apis/get";

export default async function SCSchedulesByRole({role}: {role: string}) {
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
      <table className="table-auto border w-full bg-slate-300 text-sm">
        <thead>
          <tr className="bg-slate-900 border border-slate-500">
            <RoleDropdown role={role} />
          </tr>
          <tr>
            <th className="border border-slate-500 w-20"></th>
            { service?.[category.SATURDAY_SERVICE]?.length &&
              <Fragment>
                <th className="border border-slate-500 uppercase">{category.SATURDAY_SERVICE}</th>
                <th className="border border-slate-500 w-20"></th>
              </Fragment>
            }
            <th className="border border-slate-500 uppercase">{common.FIRST_SERVICE}</th>
            <th className="border border-slate-500 uppercase">{common.SECOND_SERVICE}</th>
            <th className="border border-slate-500 uppercase">{common.THIRD_SERVICE}</th>
          </tr>
        </thead>
        <tbody>
          { service[common.FIRST_SERVICE].slice(0, 18).map((firstService: any, i: number) => {
            const sns = service?.[category.SATURDAY_SERVICE];
            const secondService = service[common.SECOND_SERVICE][i];
            const thirdService = service[common.THIRD_SERVICE][i];

            return (
              <tr key={firstService.date}>
                { sns?.length &&
                  <Fragment>
                    <td className="border border-slate-500 bg-slate-100 w-20">{formatDate(sns[i].date)}</td>
                    <SCVolunteerCell service={sns?.[i]} />
                  </Fragment>
                }
                <td className="border border-slate-500 bg-slate-100 w-20">{formatDate(firstService.date)}</td>
                <SCVolunteerCell service={firstService} />
                <SCVolunteerCell service={secondService} />
                <SCVolunteerCell service={thirdService} />
              </tr>
            )})
          }
        </tbody>
      </table>
    </Fragment>
  );
}
