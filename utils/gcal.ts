import { google } from "googleapis";

export interface RawGCalEvent {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  colorId?: string;
  start?: { dateTime?: string; date?: string; };
  end?: { dateTime?: string; date?: string; };
  updated?: string;
}

function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || "";
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google Calendar credentials (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY)");
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

export async function fetchGCalEvents(fromISO: string, toISO: string, calendarId?: string) {
  const calId = calendarId || process.env.GOOGLE_CALENDAR_ID || "";
  if (!calId) {
    throw new Error("Missing GOOGLE_CALENDAR_ID");
  }

  const jwt = getGoogleAuth();
  const calendar = google.calendar({ version: "v3", auth: jwt });
  const res = await calendar.events.list({
    calendarId: calId,
    timeMin: new Date(fromISO).toISOString(),
    timeMax: new Date(toISO).toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 2500,
  });

  return (res.data.items || []) as RawGCalEvent[];
}

export async function createGCalEvent(eventData: {
  eventName: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  otherDetails?: string;
}, calendarId?: string) {
  const calId = calendarId || process.env.GOOGLE_CALENDAR_ID || "";
  if (!calId) {
    throw new Error("Missing GOOGLE_CALENDAR_ID");
  }

  const jwt = getGoogleAuth();
  const calendar = google.calendar({ version: "v3", auth: jwt });

  const startDateTime = new Date(`${eventData.date}T${convertTo24Hour(eventData.startTime)}.000+08:00`);
  const endDateTime = new Date(`${eventData.date}T${convertTo24Hour(eventData.endTime)}.000+08:00`);

  const event = {
    summary: eventData.eventName,
    location: eventData.venue,
    description: eventData.otherDetails || '',
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'Asia/Manila',
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'Asia/Manila',
    },
  };

  const res = await calendar.events.insert({
    calendarId: calId,
    requestBody: event,
  });

  return res.data.id;
}

export async function updateGCalEvent(googleEventId: string, eventData: {
  eventName: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  otherDetails?: string;
}, calendarId?: string) {
  const calId = calendarId || process.env.GOOGLE_CALENDAR_ID || "";
  if (!calId) {
    throw new Error("Missing GOOGLE_CALENDAR_ID");
  }

  const jwt = getGoogleAuth();
  const calendar = google.calendar({ version: "v3", auth: jwt });

  const startDateTime = new Date(`${eventData.date}T${convertTo24Hour(eventData.startTime)}.000+08:00`);
  const endDateTime = new Date(`${eventData.date}T${convertTo24Hour(eventData.endTime)}.000+08:00`);

  const event = {
    summary: eventData.eventName,
    location: eventData.venue,
    description: eventData.otherDetails || '',
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'Asia/Manila',
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'Asia/Manila',
    },
  };

  await calendar.events.update({
    calendarId: calId,
    eventId: googleEventId,
    requestBody: event,
  });
}

function convertTo24Hour(time12h: string): string {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') {
    hours = '00';
  }
  if (modifier === 'PM') {
    hours = (parseInt(hours, 10) + 12).toString();
  }
  return `${hours.padStart(2, '0')}:${minutes}:00`;
}
