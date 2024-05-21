import SchedulesByRole from "@/components/SchedulesByRole";
import Link from "next/link";
import { Fragment } from "react";

export default async function SecondRoleDisplay({ params }: { params: { role1: string, role2: string } }) {
  return (
    <Fragment>
      <Link className="text-white p-2 bg-slate-500 rounded-md" href="/schedule/role/foh">Single View</Link>
      <div className="flex gap-3">
        <SchedulesByRole role={decodeURI(params.role1)} />
        <SchedulesByRole role={decodeURI(params.role2)} />
      </div>
    </Fragment>
  );
}
