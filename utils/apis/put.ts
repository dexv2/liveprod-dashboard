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
  roles?: string[]
  gender?: string
  phone?: string
  trainings?: Array<{ name: string; date: string }>
}

export const putUpdateVolunteer = async (id: string, body: VolunteerData) => {
  try {
    const res = await fetch(`${SOURCE_URL}/api/volunteers/${id}`, {
      method: "PUT",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error("Failed to update volunteer");
    }

    return await res.json();
  } catch (error) {
    console.log("Error updating volunteer", error);
    throw error;
  }
}

export const putUpdateEvent = async (id: string, body: any) => {
  try {
    const res = await fetch(`${SOURCE_URL}/api/events/${id}`, {
      method: "PUT",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error("Failed to update event");
    }

    return await res.json();
  } catch (error) {
    console.log("Error updating event", error);
    throw error;
  }
}


