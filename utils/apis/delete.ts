import { SOURCE_URL } from "./source";

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

export const deleteEventData = async (id: string) => {
  try {
    const res = await fetch(`${SOURCE_URL}/api/events/id/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      throw new Error("Failed to delete event");
    }

    return await res.json();
  } catch (error) {
    console.log("Error deleting event", error);
  }
}
