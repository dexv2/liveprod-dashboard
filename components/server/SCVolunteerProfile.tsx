import CCVolunteerProfile from "@/components/client/CCVolunteerProfile";
import { getVolunteerById } from "@/utils/apis/get";
import { serviceTime } from "@/utils/constants";
import { checkAuth } from "@/utils/helpers";
import { redirect } from "next/navigation";

export default async function SCVolunteerProfile({ id }: { id: string }) {
  try {
    const isAuthenticated = await checkAuth();

    const res = await getVolunteerById(id);
    const volunteer = res.data;
    const from = (date: string, service: string): Date => {
      return new Date(`${new Date(date).toLocaleDateString()} ${serviceTime[service]}`);
    }
    const to = (from: Date): Date => {
      return new Date(from.setHours(from.getHours() + 2))
    }
    const schedule: any[] = [];
    let lastSchedule = new Date().getTime();

    for (let i = 0; i < volunteer?.schedules?.length; i++) {
      const sched = volunteer.schedules[i];
      const newSchedule = new Date(from(sched.date, sched.service)).getTime();
      if (newSchedule > lastSchedule) {
        lastSchedule = newSchedule;
      }

      schedule.push({
        id: sched._id,
        title: sched.role.toUpperCase(),
        start: from(sched.date, sched.service),
        end: to(from(sched.date, sched.service))
      });
    }

    return (
      <CCVolunteerProfile volunteer={volunteer} isAuthenticated={isAuthenticated} />
    )
  } catch (error) {
    redirect("/");
  }
}
