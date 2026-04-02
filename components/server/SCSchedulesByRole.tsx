import { category } from "@/utils/constants";
import { redirect } from "next/navigation";
import { getSchedulesByRole } from "@/utils/apis/get";
import CCScheduleByRoleData from '../client/CCScheduleByRoleData';

export default async function SCSchedulesByRole({role}: {role: string}) {
  if (!category.ROLES.includes(role)) {
    redirect("/");
  }

  try {
    const res = await getSchedulesByRole(role);

    return (
      <CCScheduleByRoleData role={role} data={res?.data} />
    );
  } catch (error) {
    return (
      <CCScheduleByRoleData role={role} data={{}} isError={true} error={error} />
    );
  }
}