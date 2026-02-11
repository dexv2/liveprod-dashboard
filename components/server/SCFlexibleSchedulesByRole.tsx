import { category } from "@/utils/constants";
import { formatDate } from "@/utils/helpers";
import { redirect } from "next/navigation";
import { Fragment } from "react";
import { getSchedulesByRole } from "@/utils/apis/get";
import CCFlexibleScheduleByRole from "../client/CCFlexibleScheduleByRole";
import { scheduleConfigManager, ServiceTime } from "@/utils/scheduleConfig";
import CCVolunteerCell from '../client/CCVolunteerCell';

export default async function SCFlexibleSchedulesByRole({role}: {role: string}) {
  if (!category.ROLES.includes(role)) {
    redirect("/");
  }

  const res = await getSchedulesByRole(role);
  const service: any = {};
  for (let i = 0; i < res.data.length; i++) {
    const schedule = res.data[i];
    service[schedule._id] = schedule.service;
  }

  // Get active services from configuration
  const activeServices = scheduleConfigManager.getActiveServices();
  const saturdayServices = activeServices.filter(s => s.day === 'saturday');
  const sundayServices = activeServices.filter(s => s.day === 'sunday');

  // Get the first Sunday service to determine number of rows
  const firstSundayService = sundayServices[0];
  const serviceData = firstSundayService ? service[firstSundayService.id] : [];

  return (
    <CCFlexibleScheduleByRole role={role} service={service}>
      <tbody>
        {serviceData?.map((firstService: any, i: number) => {
          // Get Saturday services data
          const saturdayServicesData = saturdayServices.map(serviceTime => 
            service[serviceTime.id]?.[i]
          );

          // Get Sunday services data
          const sundayServicesData = sundayServices.map(serviceTime => 
            service[serviceTime.id]?.[i]
          );

          return (
            <tr key={i} className="border border-slate-300 bg-slate-100 odd:bg-slate-200 snap-start">
              {/* Saturday services */}
              {saturdayServices.map((serviceTime, idx) => {
                const serviceData = saturdayServicesData[idx];
                return (
                  <Fragment key={serviceTime.id}>
                    {idx === 0 && (
                      <td className="w-20 text-center">
                        {serviceData ? formatDate(serviceData.date) : ''}
                      </td>
                    )}
                    <CCVolunteerCell service={serviceData} />
                  </Fragment>
                );
              })}
              
              {/* Sunday services */}
              {sundayServices.map((serviceTime, idx) => {
                const serviceData = sundayServicesData[idx];
                return (
                  <Fragment key={serviceTime.id}>
                    {idx === 0 && saturdayServices.length > 0 && (
                      <td className="border border-slate-300 w-20 text-center">
                        {serviceData ? formatDate(serviceData.date) : ''}
                      </td>
                    )}
                    {idx === 0 && saturdayServices.length === 0 && (
                      <td className="border border-slate-300 w-20 text-center">
                        {serviceData ? formatDate(serviceData.date) : ''}
                      </td>
                    )}
                    <CCVolunteerCell service={serviceData} />
                  </Fragment>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </CCFlexibleScheduleByRole>
  );
}
