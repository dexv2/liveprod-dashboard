import { SOURCE_URL } from "./source";

export const postAddVolunteer = async (name: string, tier: string, segment: string) => {
  await fetch(`${SOURCE_URL}/api/volunteers`, {
    method: "POST",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify({ name, tier, segment })
  });
}

export const postCreateMonthSchedule = async (year: number, month: number) => {
  await fetch(`${SOURCE_URL}/api/schedule/month-bulk`, {
    method: "POST",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify({ year, month })
  });
}
