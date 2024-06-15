import SCSchedulesByRole from "@/components/server/SCSchedulesByRole";
import { Fragment } from "react";

export default function SecondRoleDisplay({ params }: { params: { role1: string, role2: string, role3: string } }) {
  return (
    <Fragment>
      <div className="flex gap-px">
        <SCSchedulesByRole role={decodeURI(params.role1)} />
        <SCSchedulesByRole role={decodeURI(params.role2)} />
        <SCSchedulesByRole role={decodeURI(params.role3)} />
      </div>
    </Fragment>
  );
}
