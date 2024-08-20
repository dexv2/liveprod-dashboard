"use client";

import { category, common } from "@/utils/constants";
// import { formatDate } from "@/utils/helpers";
import { Fragment } from "react";
import SCVolunteerCell from "@/components/server/SCVolunteerCell";

export default function CCSchedulesByRole({ service }: { service: any }) {
  return (
    <tbody>
      { service[common.FIRST_SERVICE].slice(0, 18).map((firstService: any, i: number) => {
        const sns = service?.[category.SATURDAY_SERVICE[0]];
        const secondService = service[common.SECOND_SERVICE][i];
        const thirdService = service[common.THIRD_SERVICE][i];

        return (
          <tr key={i}>
            { sns?.length &&
              <Fragment>
                <td className="border border-slate-500 bg-slate-100 w-20">{sns[i].date}</td>
                <SCVolunteerCell service={sns?.[i]} />
              </Fragment>
            }
            <td className="border border-slate-500 bg-slate-100 w-20">{firstService.date}</td>
            <SCVolunteerCell service={firstService} />
            <SCVolunteerCell service={secondService} />
            <SCVolunteerCell service={thirdService} />
          </tr>
        )})
      }
    </tbody>
  );
}
