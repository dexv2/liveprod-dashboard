import type { AnnouncementExpirationMode } from "@/models/announcement";

export const DEFAULT_ANNOUNCEMENT_EXPIRATION_DAYS = 7;
export const MANILA_TIME_ZONE = "Asia/Manila";
const MANILA_OFFSET = "+08:00";
const DAY_MS = 24 * 60 * 60 * 1000;

type DateValue = Date | string | null | undefined;

export interface AnnouncementExpirationInput {
  expirationMode: AnnouncementExpirationMode;
  publishAt: DateValue;
  expirationDays?: number;
  customDate?: string;
  relevantDate?: DateValue;
  eventDate?: DateValue;
}

export interface NormalizedAnnouncementExpiration {
  expirationMode: AnnouncementExpirationMode;
  publishAt: Date;
  expirationDays?: number;
  expiresAt?: Date;
  relevantDate?: Date;
  relatedEvent?: string;
}

export interface AnnouncementForVisibility {
  isActive?: boolean;
  isArchived?: boolean;
  publishAt?: DateValue;
  createdAt?: DateValue;
  expirationMode?: AnnouncementExpirationMode;
  expirationDays?: number;
  expiresAt?: DateValue;
  relevantDate?: DateValue;
  relatedEvent?: { date?: DateValue } | null;
}

function validDate(value: DateValue): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseManilaCalendarDate(dateText: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) throw new Error("A valid calendar date is required");
  const date = new Date(`${dateText}T00:00:00.000${MANILA_OFFSET}`);
  if (Number.isNaN(date.getTime()) || getManilaCalendarDate(date) !== dateText) {
    throw new Error("A valid calendar date is required");
  }
  return date;
}

export function getManilaCalendarDate(value: DateValue): string {
  const date = validDate(value);
  if (!date) throw new Error("A valid date is required");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function endOfManilaCalendarDate(value: DateValue): Date {
  const dateText = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value : getManilaCalendarDate(value);
  return new Date(parseManilaCalendarDate(dateText).getTime() + DAY_MS - 1);
}

export function calculateAnnouncementExpiresAt(input: AnnouncementExpirationInput): Date | null {
  const publishAt = validDate(input.publishAt);
  if (!publishAt) throw new Error("A valid publication date is required");
  switch (input.expirationMode) {
    case "NEVER": return null;
    case "AFTER_DAYS": {
      const days = Number(input.expirationDays ?? DEFAULT_ANNOUNCEMENT_EXPIRATION_DAYS);
      if (!Number.isInteger(days) || days <= 0) throw new Error("Expiration days must be a positive whole number");
      return endOfManilaCalendarDate(new Date(publishAt.getTime() + days * DAY_MS));
    }
    case "CUSTOM":
      if (!input.customDate) throw new Error("A custom expiration date is required");
      return endOfManilaCalendarDate(input.customDate);
    case "EVENT_DATE": {
      const date = input.eventDate ?? input.relevantDate;
      if (!validDate(date)) throw new Error("An event or relevant date is required");
      return endOfManilaCalendarDate(date);
    }
  }
}

export function normalizeAnnouncementExpiration(
  input: AnnouncementExpirationInput & { relatedEvent?: string },
  eventDate?: DateValue
): NormalizedAnnouncementExpiration {
  const publishAt = validDate(input.publishAt);
  if (!publishAt) throw new Error("A valid publication date is required");
  const expiresAt = calculateAnnouncementExpiresAt({
    expirationMode: input.expirationMode,
    publishAt,
    expirationDays: input.expirationDays,
    customDate: input.customDate,
    relevantDate: input.expirationMode === "EVENT_DATE" ? input.relevantDate : undefined,
    eventDate: input.expirationMode === "EVENT_DATE" ? eventDate : undefined
  });
  if (expiresAt && expiresAt.getTime() < publishAt.getTime()) {
    throw new Error("Expiration cannot be before publication");
  }

  switch (input.expirationMode) {
    case "EVENT_DATE":
      return {
        expirationMode: input.expirationMode,
        publishAt,
        expiresAt: expiresAt!,
        ...(input.relatedEvent ? { relatedEvent: input.relatedEvent } : {}),
        ...(!input.relatedEvent && input.relevantDate
          ? { relevantDate: parseManilaCalendarDate(getManilaCalendarDate(input.relevantDate)) }
          : {})
      };
    case "AFTER_DAYS":
      return {
        expirationMode: input.expirationMode,
        publishAt,
        expirationDays: Number(input.expirationDays ?? DEFAULT_ANNOUNCEMENT_EXPIRATION_DAYS),
        expiresAt: expiresAt!
      };
    case "CUSTOM":
      return { expirationMode: input.expirationMode, publishAt, expiresAt: expiresAt! };
    case "NEVER":
      return { expirationMode: input.expirationMode, publishAt };
  }
}

export function getEffectiveAnnouncementExpiration(announcement: AnnouncementForVisibility): Date | null {
  if (announcement.expirationMode === "NEVER") return null;
  const stored = validDate(announcement.expiresAt);
  if (stored) return stored;
  const eventDate = announcement.relatedEvent?.date;
  if (announcement.expirationMode === "EVENT_DATE" && (eventDate || announcement.relevantDate)) {
    return endOfManilaCalendarDate(eventDate ?? announcement.relevantDate);
  }
  // Legacy records have no expiration fields, so fall back to seven days after publication/creation.
  const published = validDate(announcement.publishAt) ?? validDate(announcement.createdAt);
  if (!published) return new Date(0);
  const days = Number(announcement.expirationDays ?? DEFAULT_ANNOUNCEMENT_EXPIRATION_DAYS);
  const safeDays = Number.isInteger(days) && days > 0 ? days : DEFAULT_ANNOUNCEMENT_EXPIRATION_DAYS;
  return endOfManilaCalendarDate(new Date(published.getTime() + safeDays * DAY_MS));
}

export type AnnouncementStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "ARCHIVED";

export function getAnnouncementStatus(announcement: AnnouncementForVisibility, now = new Date()): AnnouncementStatus {
  if (announcement.isArchived || announcement.isActive === false) return "ARCHIVED";
  const publishAt = validDate(announcement.publishAt) ?? validDate(announcement.createdAt);
  if (publishAt && publishAt.getTime() > now.getTime()) return "SCHEDULED";
  const expiresAt = getEffectiveAnnouncementExpiration(announcement);
  if (expiresAt && expiresAt.getTime() < now.getTime()) return "EXPIRED";
  return "ACTIVE";
}

export function isAnnouncementVisible(announcement: AnnouncementForVisibility, now = new Date()): boolean {
  return getAnnouncementStatus(announcement, now) === "ACTIVE";
}
