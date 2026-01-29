import { category } from "@/utils/constants";
import { redirect } from "next/navigation";
import { getSchedulesByRole } from "@/utils/apis/get";
import { checkAuth } from '@/utils/helpersServer';
import CCScheduleByRoleData from '../client/CCScheduleByRoleData';

export default async function SCSchedulesByRole({role}: {role: string}) {
  const isAuthenticated = await checkAuth();
  if (!category.ROLES.includes(role)) {
    redirect("/");
  }

  try {
    const res = await getSchedulesByRole(role);

    return (
      <CCScheduleByRoleData role={role} data={res?.data} isAuthenticated={isAuthenticated} />
    );
  } catch (error) {
    return (
      <CCScheduleByRoleData role={role} data={{}} isAuthenticated={false} isError={true} error={error} />
    );
  }
}