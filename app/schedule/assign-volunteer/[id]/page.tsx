import SCSchedulesByRole from "@/components/server/SCSchedulesByRole";
import { Fragment } from "react";

export default function AssignVolunteerPage() {
  // Use a specific valid role - FOH Observer
  const role = "foh observer";

  return (
    <Fragment>
      <div className='flex flex-col gap-3 px-2 lg:px-0'>
        <div className="flex justify-center">
          <div className="w-full lg:w-1/2 rounded-t-xl rounded-b-lg h-50 overflow-hidden">
            <SCSchedulesByRole role={role} />
          </div>
        </div>
      </div>
    </Fragment>
  );
}
