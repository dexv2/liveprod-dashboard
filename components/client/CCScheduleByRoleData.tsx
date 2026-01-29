"use client";

import { category } from "@/utils/constants";
import { formatDate } from "@/utils/helpers";
import { Fragment, useMemo } from "react";
import CCSchedulesByRole from "../client/CCScheduleByRole";
import CCVolunteerCell from './CCVolunteerCell';
import { useLockScrollContext } from '@/context/LockScrollProvider';

export default function CCScheduleByRoleData(
{
  role,
  data,
  isAuthenticated,
  isError = false,
  error,
}: {
  role: string,
  data?: any,
  isAuthenticated: boolean,
  isError?: boolean,
  error?: unknown,
}) {
  const lockScroll = useLockScrollContext();

  try {
    if (!data) {
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

    if (isError) {
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

    const service: any = {};
    for (let i = 0; i < data.length; i++) {
      const schedule = data[i];
      service[schedule._id] = schedule.service;
    }

    const serviceArr = lockScroll ? service[category.SUNDAY_SERVICES[0]].slice(0,8) : service[category.SUNDAY_SERVICES[0]] ;

    const hasSaturday = Boolean(service?.[category.SATURDAY_SERVICES[0]]?.length);

    return (
      <CCSchedulesByRole role={role} service={service} hasSaturday={hasSaturday}>
        <tbody>
          { serviceArr.map((firstService: any, i: number) => {
            const snsFirst = service?.[category.SATURDAY_SERVICES[0]];
            // const snsSecond = service?.[category.SATURDAY_SERVICES[1]];
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
                    <CCVolunteerCell service={snsFirst?.[i]} isAuthenticated={isAuthenticated} />
                  </Fragment>
                )}
                <td className="border border-slate-300 w-12 lg:w-20 text-center text-[8px] md:text-xs lg:text-sm px-0.5 lg:px-1">
                  {firstService?.date ? formatDate(firstService.date) : ''}
                </td>
                <CCVolunteerCell service={firstService} isAuthenticated={isAuthenticated} />
                <CCVolunteerCell service={secondService} isAuthenticated={isAuthenticated} />
                <CCVolunteerCell service={thirdService} isAuthenticated={isAuthenticated} />
                <CCVolunteerCell service={fourthService} isAuthenticated={isAuthenticated} />
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
          {/* <tr>
            <td colSpan={6} className="text-center p-4 text-red-500">
              Error loading schedules: {error instanceof Error ? error.message : 'Unknown error'}
            </td>
          </tr> */}
        </tbody>
      </CCSchedulesByRole>
    );
  }
}
