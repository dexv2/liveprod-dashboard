import { SOURCE_URL } from "./source";

// ------------------------------------ SCHEDULES ------------------------------------

export const getSchduleByDateRange = async (saturday: string, sunday: string) => {
  try {
    const res = await fetch(`${SOURCE_URL}/api/schedule/filter-by-date/${saturday}/${sunday}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to get schedules by date range");
    }

    return await res.json();
  } catch (error) {
    console.log("Error loading schedules by date range", error);
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
    // Return a proper error response structure
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export const getScheduleById = async (id: string) => {
  try {
    const res = await fetch(`${SOURCE_URL}/api/schedule/id/${id}`, {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Failed to fetch schedule");
    }

    return await res.json();
  } catch (error) {
    console.log("Error loading schedule:", error);
  }
}

export const getFilteredSchedules = async (request = {}) => {
  try {
    const res = await fetch(`${SOURCE_URL}/api/schedule/filter`, {
      cache: "no-store",
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify(request)
    });

    if (!res.ok) {
      throw new Error("Failed to get filtered schedule");
    }

    return await res.json();
  } catch (error) {
    console.log("Error loading filtered schedule", error);
  }
}

// ------------------------------------ VOLUNTEERS ------------------------------------

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
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export const getAllVolunteersPopulated = async () => {
  try {
    const res = await fetch(`${SOURCE_URL}/api/volunteers/populated`, {
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

// ------------------------------------ EVENTS ------------------------------------

export const getAllEvents = async () => {
  try {
    const res = await fetch(`${SOURCE_URL}/api/events`, {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Failed to get events");
    }

    return await res.json();
  } catch (error) {
    console.log("Error loading events", error);
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export const getAllUpcomingEvents = async () => {
  try {
    const res = await fetch(`${SOURCE_URL}/api/events/upcoming`, {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Failed to get events");
    }

    return await res.json();
  } catch (error) {
    console.log("Error loading events", error);
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export const getEventById = async (id: string) => {
  try {
    const res = await fetch(`${SOURCE_URL}/api/events/id/${id}`, {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Failed to get event");
    }

    return await res.json();
  } catch (error) {
    console.log("Error loading event", error);
  }
}

export const getAllTrainings = async () => {
  try {
    const res = await fetch(`${SOURCE_URL}/api/trainings`, {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Failed to get trainings");
    }

    return await res.json();
  } catch (error) {
    console.log("Error loading trainings", error);
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export const getTrainingById = async (id: string) => {
  try {
    const res = await fetch(`${SOURCE_URL}/api/trainings/${id}`, {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Failed to get training");
    }

    return await res.json();
  } catch (error) {
    console.log("Error loading training", error);
  }
}

export const getAllAdmins = async () => {
  try {
    const res = await fetch(`${SOURCE_URL}/api/admin`, {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Failed to get all admins");
    }

    return await res.json();
  } catch (error) {
    console.log("Error loading all admins", error);
  }
}
