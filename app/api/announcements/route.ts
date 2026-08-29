import mongoose from "mongoose";
import connectMongoDB from "@/libs/mongodb";
import Announcement, { ANNOUNCEMENT_EXPIRATION_MODES, AnnouncementExpirationMode } from "@/models/announcement";
import Event from "@/models/event";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UPDATE_ANNOUNCEMENTS, VIEW_ANNOUNCEMENTS } from "@/utils/constants";
import { authorizeAnnouncement } from "@/utils/announcementPermissions";
import { isValidAnnouncementObjectId } from "@/utils/announcementValidation";
import {
  getAnnouncementStatus,
  getEffectiveAnnouncementExpiration,
  isAnnouncementVisible,
  normalizeAnnouncementExpiration,
  parseManilaCalendarDate
} from "@/utils/announcementExpiration";

const themes = ["info", "success", "warning", "error", "celebration"];
const optionalExpirationFields = ["expirationDays", "expiresAt", "relevantDate", "relatedEvent"] as const;

class AnnouncementInputError extends Error {}

function authorizationResponse(status: 401 | 403) {
  return NextResponse.json(
    { error: status === 401 ? "Authentication required" : "Insufficient permission" },
    { status }
  );
}

function errorResponse(error: unknown) {
  if (error instanceof AnnouncementInputError || error instanceof SyntaxError || error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
    return NextResponse.json({ error: error instanceof AnnouncementInputError ? error.message : "Invalid request" }, { status: 400 });
  }
  console.error("Announcement API error:", error);
  return NextResponse.json({ error: "Unable to process announcement request" }, { status: 500 });
}

function validateContent(body: any) {
  if (!body?.title?.trim() || !body?.message?.trim()) throw new AnnouncementInputError("Title and message are required");
  if (!themes.includes(body.theme)) throw new AnnouncementInputError("A valid theme is required");
}

async function buildExpiration(body: any) {
  const expirationMode = body?.expirationMode as AnnouncementExpirationMode;
  if (!ANNOUNCEMENT_EXPIRATION_MODES.includes(expirationMode)) {
    throw new AnnouncementInputError("A valid expiration mode is required");
  }
  const publishAt = body.publishAt ? new Date(body.publishAt) : new Date();
  if (Number.isNaN(publishAt.getTime())) throw new AnnouncementInputError("A valid publication date is required");

  let eventDate: Date | undefined;
  let relatedEvent: string | undefined;
  if (expirationMode === "EVENT_DATE" && body.relatedEvent) {
    if (!isValidAnnouncementObjectId(body.relatedEvent)) throw new AnnouncementInputError("Related event ID is invalid");
    const event = await Event.findById(body.relatedEvent).select("date").lean<{ date: Date }>();
    if (!event) throw new AnnouncementInputError("Related event was not found");
    eventDate = event.date;
    relatedEvent = body.relatedEvent;
  }

  try {
    return normalizeAnnouncementExpiration({
      expirationMode,
      publishAt,
      expirationDays: Number(body.expirationDays ?? 7),
      customDate: body.customDate,
      relevantDate: expirationMode === "EVENT_DATE" && body.relevantDate
        ? parseManilaCalendarDate(body.relevantDate)
        : undefined,
      relatedEvent
    }, eventDate);
  } catch (error) {
    throw new AnnouncementInputError(error instanceof Error ? error.message : "Invalid expiration settings");
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminScope = request.nextUrl.searchParams.get("scope") === "admin";
    if (adminScope) {
      const authorization = authorizeAnnouncement(await auth(), VIEW_ANNOUNCEMENTS);
      if (!authorization.allowed) return authorizationResponse(authorization.status);
    }

    await connectMongoDB();
    const records = await Announcement.find(adminScope ? {} : { isActive: true, isArchived: { $ne: true } })
      .populate("relatedEvent", "eventName date")
      .sort({ isPinned: -1, createdAt: -1 })
      .lean();
    const now = new Date();
    const announcements = records
      .map((record: any) => ({
        ...record,
        effectiveExpiresAt: getEffectiveAnnouncementExpiration(record),
        computedStatus: getAnnouncementStatus(record, now)
      }))
      .filter((record: any) => adminScope || isAnnouncementVisible(record, now));
    return NextResponse.json({ data: announcements });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorization = authorizeAnnouncement(await auth(), UPDATE_ANNOUNCEMENTS);
    if (!authorization.allowed) return authorizationResponse(authorization.status);
    const body = await request.json();
    validateContent(body);
    await connectMongoDB();
    const expiration = await buildExpiration(body);
    const announcement = await Announcement.create({
      title: body.title.trim(),
      message: body.message.trim(),
      theme: body.theme,
      isPinned: Boolean(body.isPinned),
      ...expiration
    });
    return NextResponse.json({ data: announcement, message: "Announcement created successfully" }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authorization = authorizeAnnouncement(await auth(), UPDATE_ANNOUNCEMENTS);
    if (!authorization.allowed) return authorizationResponse(authorization.status);
    const body = await request.json();
    if (!body?._id) throw new AnnouncementInputError("Announcement ID is required");
    if (!isValidAnnouncementObjectId(body._id)) throw new AnnouncementInputError("Announcement ID is invalid");

    await connectMongoDB();
    const exists = await Announcement.exists({ _id: body._id });
    if (!exists) return NextResponse.json({ error: "Announcement not found" }, { status: 404 });

    validateContent(body);
    const expiration = await buildExpiration(body);
    const setValues: Record<string, unknown> = {
      title: body.title.trim(),
      message: body.message.trim(),
      theme: body.theme,
      isPinned: Boolean(body.isPinned),
      expirationMode: expiration.expirationMode,
      publishAt: expiration.publishAt
    };
    const unsetValues: Record<string, 1> = {};
    for (const field of optionalExpirationFields) {
      if (expiration[field] === undefined) unsetValues[field] = 1;
      else setValues[field] = expiration[field];
    }

    const announcement = await Announcement.findByIdAndUpdate(body._id, {
      $set: setValues,
      ...(Object.keys(unsetValues).length ? { $unset: unsetValues } : {})
    }, { new: true, runValidators: true });
    if (!announcement) return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    return NextResponse.json({ data: announcement, message: "Announcement updated successfully" });
  } catch (error) {
    return errorResponse(error);
  }
}
