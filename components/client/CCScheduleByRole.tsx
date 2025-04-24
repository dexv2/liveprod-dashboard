"use client";

import { category, saturday, sunday } from "@/utils/constants";
import { Fragment } from "react";
import RoleDropdown from "@/components/client/CCRoleDropdown";

export default function CCSchedulesByRole({ role, service, children }: { role: string, service: any, children: React.ReactNode }) {
  return (
    <div className="flex flex-col w-full">
      <div className="bg-slate-800 border border-slate-800 flex justify-center">
        <RoleDropdown role={role} />
      </div>
      <div className="relative max-h-[240px] overflow-y-scroll no-scrollbar snap-y snap-mandatory transition-all delay-1000">
        <table className="table-auto w-full text-sm">
          <thead>
            <tr className="snap-start">
              <th className="sticky top-px bg-slate-300 border border-slate-300 w-20">SNS</th>
              { service?.[category.SATURDAY_SERVICES[0]]?.length &&
                <Fragment>
                  <th className="sticky top-px bg-slate-300 border border-slate-300 uppercase">{saturday.FIRST_SERVICE}</th>
                  <th className="sticky top-px bg-slate-300 border border-slate-300 uppercase">{saturday.SECOND_SERVICE}</th>
                  <th className="sticky top-px bg-slate-300 border border-slate-300 w-20">SUNDAY</th>
                </Fragment>
              }
              <th className="sticky top-px bg-slate-300 border border-slate-300 uppercase py-0.5">{sunday.FIRST_SERVICE}</th>
              <th className="sticky top-px bg-slate-300 border border-slate-300 uppercase">{sunday.SECOND_SERVICE}</th>
              <th className="sticky top-px bg-slate-300 border border-slate-300 uppercase">{sunday.THIRD_SERVICE}</th>
              <th className="sticky top-px bg-slate-300 border border-slate-300 uppercase">{sunday.FOURTH_SERVICE}</th>
            </tr>
          </thead>
          { children }
        </table>
      </div>
    </div>
  );
}
