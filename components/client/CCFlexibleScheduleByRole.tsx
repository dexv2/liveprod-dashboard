"use client";

import RoleDropdown from "@/components/client/CCRoleDropdown";
import { scheduleConfigManager, ServiceTime } from "@/utils/scheduleConfig";

interface CCFlexibleScheduleByRoleProps {
  role: string;
  service: any;
  children: React.ReactNode;
  customConfig?: ServiceTime[];
}

export default function CCFlexibleScheduleByRole({ 
  role, 
  service, 
  children, 
  customConfig 
}: CCFlexibleScheduleByRoleProps) {
  // Use custom config if provided, otherwise use default
  const activeServices = customConfig || scheduleConfigManager.getActiveServices();
  const saturdayServices = activeServices.filter(s => s.day === 'saturday');
  const sundayServices = activeServices.filter(s => s.day === 'sunday');
  
  // Check if we have any Saturday services
  const hasSaturdayServices = saturdayServices.length > 0;

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
              {hasSaturdayServices && saturdayServices.map((serviceTime) => (
                <th 
                  key={serviceTime.id}
                  className="sticky top-px bg-slate-300 border border-slate-300 uppercase"
                >
                  {serviceTime.name}
                </th>
              ))}
              {hasSaturdayServices && (
                <th className="sticky top-px bg-slate-300 border border-slate-300 w-20">SUNDAY</th>
              )}
              {sundayServices.map((serviceTime) => (
                <th 
                  key={serviceTime.id}
                  className="sticky top-px bg-slate-300 border border-slate-300 uppercase"
                >
                  {serviceTime.name}
                </th>
              ))}
            </tr>
          </thead>
          {children}
        </table>
      </div>
    </div>
  );
}
