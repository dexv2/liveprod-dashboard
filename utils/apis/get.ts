import { SOURCE_URL } from "./source";

export const getFilteredSchedule = async () => {
  const from = "05-11-2024";
  const to = "05-12-2024";
  try {
    const res = await fetch(`${SOURCE_URL}/api/schedule/filter-by-date/${from}/${to}`, {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Failed to get filtered schedule");
    }

    return await res.json();
  } catch (error) {
    console.log("Error loading filtered schedule", error);
  }
}

export const getAllVolunteers = async () => {
  try {
    const res = await fetch(`${SOURCE_URL}/api/volunteers`, {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Failed to get volunteers");
    }
    
    return await res.json();
  } catch (error) {
    console.log("Error loading volunteers", error);
  }
}

export const getSchedulesByRole = async (role: string) => {
  try {
    const res = await fetch(`${SOURCE_URL}/api/schedule/${role}`, {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Failed to fetch schedules");
    }

    return await res.json();
  } catch (error) {
    console.log("Error loading schedules:", error);
  }
}

export const getVolunteerById = async (id: string) => {
  try {
    const res = await fetch(`${SOURCE_URL}/api/volunteers/${id}`, {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Failed to get volunteer");
    }

    return await res.json();
  } catch (error) {
    console.log("Error loading volunteer", error);
  }
}
