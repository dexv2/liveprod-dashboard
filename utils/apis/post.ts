import { SOURCE_URL } from "./source";

interface VolunteerData {
  firstName?: string
  lastName?: string
  nickName?: string
  segment?: string
  status?: string
}

interface Event {
  _id?: string;
  status: string;
  date: string;
  day: string;
  eventName: string;
  venue: string;
  callTime: string;
  startTime: string;
  endTime: string;
  praiseAndWorship: string;
  otherDetails: string;
  volunteersNeeded: {
    foh: boolean;
    assistantFoh: boolean;
    bcMix: boolean;
    assistantBcMix: boolean;
    monMix: boolean;
    rfTech: boolean;
  };
  assignedVolunteers?: {
    foh?: string;
    assistantFoh?: string;
    bcMix?: string;
    assistantBcMix?: string;
    monMix?: string;
    rfTech?: string;
  };
}

export const postAddVolunteer = async (body: VolunteerData) => {
  await fetch(`${SOURCE_URL}/api/volunteers`, {
    method: "POST",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

export const postCreateMonthSchedule = async () => {
  await fetch(`${SOURCE_URL}/api/schedule/month-bulk`, {
    method: "POST"
  });
}

export const getAdmin = async (username: string, password: string) => {
  try {
    const res = await fetch(`${SOURCE_URL}/api/admin/get`, {
      cache: "no-store",
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      throw new Error("Failed to get admin");
    }

    return await res.json();
  } catch (error) {
    console.log("Error loading admin:", error);
  }
}

export const postAddEvent = async (eventData: Event) => {
  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
  } catch (error) {
    console.error('Error creating event:', error);
  }
}

export const postAddTraining = async (trainingData: any) => {
  try {
    await fetch('/api/trainings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trainingData)
    });
  } catch (error) {
    console.error('Error creating training:', error);
  }
}
