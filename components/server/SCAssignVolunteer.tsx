import CpAssignVolunteer from "@/components/AssignVolunteer";
import { getAllVolunteersPopulated, getScheduleById } from '@/utils/apis/get';

export default async function USAssignVolunteer({ id }: { id: string }) {
  const volunteersRes = await getAllVolunteersPopulated();
  const scheduleRes = await getScheduleById(id);

  const volunteers = volunteersRes.data.map((volunteer: any) => {
    const res = {
      _id: volunteer._id,
      name: volunteer.name,
      available: true,
      message: "",
      prevSchedId: "",
      role: ""
    };

    for (let i = 0; i < volunteer?.schedules?.length || 0; i++) {
      const volunteerSchedule = volunteer.schedules[i];
      if (volunteerSchedule.date === scheduleRes.data.date && volunteerSchedule.service === scheduleRes.data.service) {
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
    <CpAssignVolunteer volunteers={volunteers} schedule={scheduleRes.data} />
  );
}
