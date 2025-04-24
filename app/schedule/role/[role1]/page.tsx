import SCSchedulesByRole from "@/components/server/SCSchedulesByRole";
import { roleFilter } from '@/utils/constants';
import { chunkArray } from '@/utils/helpers';
import { Fragment } from "react";

export default function ScheduleByRole({params}: {params: {role1: string}}) {
  const roles = roleFilter.find((role) => role.value === decodeURI(params.role1))?.roles || [];
  const columns = chunkArray(roles, 2);

  return (
    <Fragment>
      <div className='flex flex-col gap-3'>
        { columns.map((column, index) => (
          <div key={index} className="flex gap-3 justify-center">
            { column.map((role, idx) => (
              <div key={idx} className={`${column.length === 1 ? "w-1/2": "w-full"} rounded-t-xl rounded-b-lg h-50 overflow-hidden`}>
                <SCSchedulesByRole role={role} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </Fragment>
  );
}
