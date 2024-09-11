import { category, common } from "@/utils/constants";
import { formatDate } from "@/utils/helpers";
import { redirect } from "next/navigation";
import { Fragment } from "react";
import SCVolunteerCell from "@/components/server/SCVolunteerCell";
import RoleDropdown from "@/components/client/CCRoleDropdown";
import { getSchedulesByRole } from "@/utils/apis/get";
import CCSchedulesByRole from "../client/CCScheduleByRole";

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
    <CCSchedulesByRole role={role} service={service}>
      <tbody>
        { service[common.FIRST_SERVICE].map((firstService: any, i: number) => {
          const sns = service?.[category.SATURDAY_SERVICE[0]];
          const secondService = service[common.SECOND_SERVICE][i];
          const thirdService = service[common.THIRD_SERVICE][i];

          return (
            <tr key={i} className="bg-slate-100 odd:bg-slate-200 snap-start">
              { sns?.length &&
                <Fragment>
                  <td className="border border-slate-300 w-20 text-center">{formatDate(sns[i].date)}</td>
                  <SCVolunteerCell service={sns?.[i]} />
                </Fragment>
              }
              <td className="border border-slate-300 w-20 text-center">{formatDate(firstService.date)}</td>
              <SCVolunteerCell service={firstService} />
              <SCVolunteerCell service={secondService} />
              <SCVolunteerCell service={thirdService} />
            </tr>
          )})
        }
      </tbody>
    </CCSchedulesByRole>
  );
}