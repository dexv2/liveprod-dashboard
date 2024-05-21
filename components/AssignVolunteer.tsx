import { getAllVolunteersPopulated, getScheduleById } from '@/utils/apis/get';
import Select from './Select'

export default async function AssignVolunteer({ scheduleId }: { scheduleId: string }) {
  const volunteersRes = await getAllVolunteersPopulated();
  const scheduleRes = await getScheduleById(scheduleId);

  const volunteers = volunteersRes.data.map((volunteer: any) => {
    const res = {
      _id: volunteer._id,
      name: volunteer.name,
      available: true,
      message: ""
    };

    for (let i = 0; i < volunteer?.schedules?.length || 0; i++) {
      const volunteerSchedule = volunteer.schedules[i];
      if (volunteerSchedule.date === scheduleRes.data.date && volunteerSchedule.service === scheduleRes.data.service) {
        res.available = false;
        res.message = `${volunteer.name} is already assigned to this service as ${volunteerSchedule.role}.`;
        break;
      }
    }
    return res;
  });

  return (
    <Select volunteers={volunteers} schedule={scheduleRes.data} />
  )
}
