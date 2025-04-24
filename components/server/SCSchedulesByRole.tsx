import { category } from "@/utils/constants";
import { formatDate } from "@/utils/helpers";
import { redirect } from "next/navigation";
import { Fragment } from "react";
import SCVolunteerCell from "@/components/server/SCVolunteerCell";
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
        { service[category.SUNDAY_SERVICES[0]]?.map((firstService: any, i: number) => {
          const snsFirst = service?.[category.SATURDAY_SERVICES[0]];
          const snsSecond = service?.[category.SATURDAY_SERVICES[1]];
          const secondService = service[category.SUNDAY_SERVICES[1]][i];
          const thirdService = service[category.SUNDAY_SERVICES[2]][i];
          const fourthService = service[category.SUNDAY_SERVICES[3]][i];

          return (
            <tr key={i} className="border border-slate-300 bg-slate-100 odd:bg-slate-200 snap-start">
              { snsFirst?.length &&
                <Fragment>
                  <td className="w-20 text-center">{formatDate(snsFirst[i].date)}</td>
                  <SCVolunteerCell service={snsFirst?.[i]} />
                  <SCVolunteerCell service={snsSecond?.[i]} />
                </Fragment>
              }
              <td className="border border-slate-300 w-20 text-center">{formatDate(firstService.date)}</td>
              <SCVolunteerCell service={firstService} />
              <SCVolunteerCell service={secondService} />
              <SCVolunteerCell service={thirdService} />
              <SCVolunteerCell service={fourthService} />
            </tr>
          )})
        }
      </tbody>
    </CCSchedulesByRole>
  );
}