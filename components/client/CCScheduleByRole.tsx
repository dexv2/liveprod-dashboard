"use client";

import { category, common } from "@/utils/constants";
import { Fragment } from "react";
import RoleDropdown from "@/components/client/CCRoleDropdown";

export default function CCSchedulesByRole({ role, service, children }: { role: string, service: any, children: React.ReactNode }) {
  return (
    <div className="flex flex-col w-full">
      <div className="bg-slate-900 border border-slate-900 flex justify-center">
        <RoleDropdown role={role} />
      </div>
      <div className="relative h-[500px] overflow-y-scroll no-scrollbar snap-y snap-mandatory transition-all delay-1000 border-b border-b-slate-300">
        <table className="table-auto w-full text-sm">
          <thead>
            <tr className="snap-start">
              <th className="sticky top-px bg-slate-300 border border-slate-300 w-20"></th>
              { service?.[category.SATURDAY_SERVICE[0]]?.length &&
                <Fragment>
                  <th className="sticky top-px bg-slate-300 border border-slate-300 uppercase">{category.SATURDAY_SERVICE[0]}</th>
                  <th className="sticky top-px bg-slate-300 border border-slate-300 w-20"></th>
                </Fragment>
              }
              <th className="sticky top-px bg-slate-300 border border-slate-300 uppercase py-0.5">{common.FIRST_SERVICE}</th>
              <th className="sticky top-px bg-slate-300 border border-slate-300 uppercase">{common.SECOND_SERVICE}</th>
              <th className="sticky top-px bg-slate-300 border border-slate-300 uppercase">{common.THIRD_SERVICE}</th>
            </tr>
          </thead>
          { children }
        </table>
      </div>
    </div>
  );
}
