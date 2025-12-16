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

  try {
    const res = await getSchedulesByRole(role);
    
    if (!res || !res.data) {
      return (
        <CCSchedulesByRole role={role} service={{}} hasSaturday={false}>
          <tbody>
            <tr>
              <td colSpan={6} className="text-center p-4 text-gray-500">
                No schedule data available
              </td>
            </tr>
          </tbody>
        </CCSchedulesByRole>
      );
    }

    const service: any = {};
    for (let i = 0; i < res.data.length; i++) {
      const schedule = res.data[i];
      service[schedule._id] = schedule.service;
    }

    const hasSaturday = Boolean(service?.[category.SATURDAY_SERVICES[0]]?.length);

    return (
      <CCSchedulesByRole role={role} service={service} hasSaturday={hasSaturday}>
        <tbody>
          { service[category.SUNDAY_SERVICES[0]]?.map((firstService: any, i: number) => {
            const snsFirst = service?.[category.SATURDAY_SERVICES[0]];
            const snsSecond = service?.[category.SATURDAY_SERVICES[1]];
            const secondService = service[category.SUNDAY_SERVICES[1]]?.[i];
            const thirdService = service[category.SUNDAY_SERVICES[2]]?.[i];
            const fourthService = service[category.SUNDAY_SERVICES[3]]?.[i];

            return (
              <tr key={i} className="border border-slate-300 bg-slate-100 odd:bg-slate-200 snap-start">
                { hasSaturday && (
                  <Fragment>
                    <td className="w-12 lg:w-20 text-center text-[8px] md:text-xs lg:text-sm px-0.5 lg:px-1">
                      {snsFirst?.[i]?.date ? formatDate(snsFirst[i].date) : ''}
                    </td>
                    <SCVolunteerCell service={snsFirst?.[i]} />
                  </Fragment>
                )}
                <td className="border border-slate-300 w-12 lg:w-20 text-center text-[8px] md:text-xs lg:text-sm px-0.5 lg:px-1">
                  {firstService?.date ? formatDate(firstService.date) : ''}
                </td>
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
  } catch (error) {
    console.error('Error loading schedules:', error);
    return (
      <CCSchedulesByRole role={role} service={{}} hasSaturday={false}>
        <tbody>
          <tr>
            <td colSpan={6} className="text-center p-4 text-red-500">
              Error loading schedules: {error instanceof Error ? error.message : 'Unknown error'}
            </td>
          </tr>
        </tbody>
      </CCSchedulesByRole>
    );
  }
}