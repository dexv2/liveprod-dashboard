"use client";

import { category, saturday, sunday } from "@/utils/constants";
import { Fragment } from "react";
import RoleDropdown from "@/components/client/CCRoleDropdown";

export default function CCSchedulesByRole({ role, service, hasSaturday }: { role: string, service: any, hasSaturday?: boolean, children: React.ReactNode }) {
  return (
    <div className="flex flex-col w-full">
      <div className="bg-slate-800 border border-slate-800 flex justify-center">
        <RoleDropdown role={role} />
      </div>
      <div className="relative max-h-[240px] overflow-x-auto overflow-y-scroll no-scrollbar snap-y snap-mandatory transition-all delay-1000">
        <table className="table-auto w-full text-[10px] md:text-xs lg:text-sm min-w-[500px] lg:min-w-0">
          <thead>
            <tr className="snap-start">
              { hasSaturday ? (
                <Fragment>
                  <th className="sticky top-px bg-slate-300 border border-slate-300 w-12 lg:w-20 px-0.5 lg:px-1 text-[8px] md:text-xs lg:text-sm">SNS</th>
                  <th className="sticky top-px bg-slate-300 border border-slate-300 uppercase px-0.5 lg:px-1 text-[8px] md:text-xs lg:text-sm">5PM</th>
                </Fragment>
              ) : null }
              <th className="sticky top-px bg-slate-300 border border-slate-300 w-12 lg:w-20 px-0.5 lg:px-1 text-[8px] md:text-xs lg:text-sm">SUN</th>
              <th className="sticky top-px bg-slate-300 border border-slate-300 uppercase py-0.5 px-0.5 lg:px-1 text-[8px] md:text-xs lg:text-sm"><span className="lg:hidden">9AM</span><span className="hidden lg:inline">{sunday.FIRST_SERVICE}</span></th>
              <th className="sticky top-px bg-slate-300 border border-slate-300 uppercase px-0.5 lg:px-1 text-[8px] md:text-xs lg:text-sm"><span className="lg:hidden">12PM</span><span className="hidden lg:inline">{sunday.SECOND_SERVICE}</span></th>
              <th className="sticky top-px bg-slate-300 border border-slate-300 uppercase px-0.5 lg:px-1 text-[8px] md:text-xs lg:text-sm"><span className="lg:hidden">3PM</span><span className="hidden lg:inline">{sunday.THIRD_SERVICE}</span></th>
              <th className="sticky top-px bg-slate-300 border border-slate-300 uppercase px-0.5 lg:px-1 text-[8px] md:text-xs lg:text-sm"><span className="lg:hidden">6PM</span><span className="hidden lg:inline">{sunday.FOURTH_SERVICE}</span></th>
            </tr>
          </thead>
          { (arguments[0] as any).children }
        </table>
      </div>
    </div>
  );
}
