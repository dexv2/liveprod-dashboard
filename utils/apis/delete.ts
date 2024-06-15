import { SOURCE_URL } from "./source";

export const putScheduleAssign = async (scheduleId: string, volunteerId: string) => {
  await fetch(`${SOURCE_URL}/api/schedule/assign/${scheduleId}/${volunteerId}`, {
    method: "PUT"
  });
}

export const putScheduleRemoveAssignee = async (scheduleId: string) => {
  await fetch(`${SOURCE_URL}/api/schedule/assign/${scheduleId}`, {
    method: "PUT"
  });
}

interface VolunteerData {
  firstName?: string
  lastName?: string
  nickName?: string
  segment?: string
  status?: string
}

export const deleteVolunteer = async (id: string) => {
  try {
    const res = await fetch(`${SOURCE_URL}/api/volunteers/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      throw new Error("Failed to delete volunteer");
    }

    return await res.json();
  } catch (error) {
    console.log("Error updating volunteer", error);
  }
}
