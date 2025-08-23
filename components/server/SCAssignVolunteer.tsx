import CCAssignVolunteer from "@/components/client/CCAssignVolunteer";
import { getAllVolunteersPopulated, getScheduleById, getFilteredSchedules } from '@/utils/apis/get';
import { eq } from "@/utils/dates";

export default async function SCAssignVolunteer({ id }: { id: string }) {
  const volunteersRes = await getAllVolunteersPopulated();
  const scheduleRes = await getScheduleById(id);
  const adjacentSchedules = await getFilteredSchedules({
    date: scheduleRes.data.date,
    role: scheduleRes.data.role
  });
  const adjacentSchedulesGrouped = adjacentSchedules.data.reduce(
    (acc: any, item: any) => {
      if (item.service === "sunday1" || item.service === "sunday2") {
        acc.am.push(item._id);
      } else if (item.service === "sunday3" || item.service === "sunday4") {
        acc.pm.push(item._id);
      } else if (item.service === "sns1" || item.service === "sns2") {
        acc.sns.push(item._id);
      }
      return acc;
    },
    { am: [], pm: [], sns: [] } as { am: string[]; pm: string[], sns: string[] }
  );

  const volunteers = volunteersRes.data.map((volunteer: any) => {
    const res = {
      _id: volunteer._id,
      name: volunteer.name,
      roles: volunteer.roles,
      available: true,
      message: "",
      prevSchedId: "",
      role: ""
    };

    for (let i = 0; i < volunteer?.schedules?.length || 0; i++) {
      const volunteerSchedule = volunteer.schedules[i];
      if (eq(new Date(volunteerSchedule.date), new Date(scheduleRes.data.date)) && volunteerSchedule.service === scheduleRes.data.service) {
        res.available = false;
        res.message = `${volunteer.name} is already assigned to this service as ${volunteerSchedule.role.toUpperCase()}. Override schedule?`;
        res.prevSchedId = volunteerSchedule._id;
        res.role = volunteerSchedule.role;
        break;
      }
    }
    return res;
  });

  return (
    <CCAssignVolunteer volunteers={volunteers} schedule={scheduleRes.data} schedulesGrouped={adjacentSchedulesGrouped} />
  );
}
