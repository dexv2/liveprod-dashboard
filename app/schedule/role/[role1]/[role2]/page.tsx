import SchedulesByRole from "@/components/SchedulesByRole";
import Link from "next/link";
import { Fragment } from "react";

export default async function SecondRoleDisplay({ params }: { params: { role1: string, role2: string } }) {
  return (
    <Fragment>
      <div className="flex gap-0.5">
        <SchedulesByRole role={decodeURI(params.role1)} />
        <SchedulesByRole role={decodeURI(params.role2)} />
      </div>
    </Fragment>
  );
}
