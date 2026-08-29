import mongoose from "mongoose";
import Assignment, { ACTIVE_ASSIGNMENT_STATUSES, EVENT_ASSIGNMENT_ROLES } from "@/models/assignment";
import Event from "@/models/event";
import Schedule from "@/models/schedule";
import Volunteer from "@/models/volunteer";
import { category } from "@/utils/constants";
import { recordVolunteerToSheet, recordVolunteerToSheetSNS } from "@/utils/gsheet";

type EventRole = typeof EVENT_ASSIGNMENT_ROLES[number];
type VolunteerMap = Partial<Record<EventRole, unknown>>;

export const assignmentServiceDependencies: any = {
  Assignment, Event, Schedule, Volunteer, recordVolunteerToSheet, recordVolunteerToSheetSNS,
  createAssignmentDocument: async (payload: Record<string, unknown>, source: any) => {
    const assignment = new Assignment(payload);
    assignment.$locals.assignmentSource = source;
    return assignment.save();
  }
};

export class AssignmentInputError extends Error {
  status: 400 | 404 | 409;
  constructor(message: string, status: 400 | 404 | 409 = 400) {
    super(message);
    this.status = status;
  }
}

export const scheduleSlotKey = (scheduleId: unknown) => `schedule:${scheduleId}`;
export const eventSlotKey = (eventId: unknown, role: EventRole) => `event:${eventId}:${role}`;

function history(action: "ASSIGNED" | "CANCELLED", adminId: string, at: Date) {
  return { action, actorType: "ADMIN", actorId: adminId, channel: "WEB", at };
}

function objectId(value: unknown): string | null {
  if (typeof value !== "string" && !(value instanceof mongoose.Types.ObjectId)) return null;
  const id = value.toString();
  return mongoose.isValidObjectId(id) ? id : null;
}

const isDuplicateKey = (error: any) => error?.code === 11000;

async function cancelActiveSlot(slotKey: string, adminId: string, at = new Date()) {
  return assignmentServiceDependencies.Assignment.findOneAndUpdate(
    { activeSlotKey: slotKey, status: { $in: ACTIVE_ASSIGNMENT_STATUSES } },
    {
      $set: { status: "CANCELLED", cancelledAt: at, cancelledBy: adminId },
      $unset: { activeSlotKey: 1 },
      $inc: { version: 1 },
      $push: { responseHistory: history("CANCELLED", adminId, at) }
    },
    { new: true, runValidators: true }
  );
}

async function createAssignment(data: {
  sourceType: "SCHEDULE" | "EVENT"; schedule?: unknown; event?: unknown;
  volunteer: unknown; role: string; scheduledBy: string; slotKey: string;
  sourceDocument: any;
}) {
  const now = new Date();
  const { sourceDocument, ...assignmentData } = data;
  return assignmentServiceDependencies.createAssignmentDocument({
    ...assignmentData,
    activeSlotKey: data.slotKey,
    status: "PENDING",
    scheduledAt: now,
    version: 1,
    responseHistory: [history("ASSIGNED", data.scheduledBy, now)]
  }, sourceDocument);
}

async function updateScheduleSheet(schedule: any, volunteerName: string) {
  if (category.SUNDAY_SERVICES.includes(schedule.service)) {
    await assignmentServiceDependencies.recordVolunteerToSheet(schedule.date, schedule.service, schedule.role, volunteerName);
  } else if (category.SATURDAY_SERVICES.includes(schedule.service)) {
    await assignmentServiceDependencies.recordVolunteerToSheetSNS(schedule.date, schedule.service, schedule.role, volunteerName);
  }
}

async function authoritativeScheduleState(scheduleId: string) {
  const schedule = await assignmentServiceDependencies.Schedule.findById(scheduleId);
  if (!schedule) throw new AssignmentInputError("Schedule not found", 404);
  return { schedule, volunteerId: objectId(schedule.volunteer) };
}

export async function reconcileScheduleAssignment(scheduleId: string, actorId: string) {
  const slotKey = scheduleSlotKey(scheduleId);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { schedule, volunteerId } = await authoritativeScheduleState(scheduleId);
    await assignmentServiceDependencies.Volunteer.updateMany(
      { schedules: schedule._id, ...(volunteerId ? { _id: { $ne: volunteerId } } : {}) },
      { $pull: { schedules: schedule._id } }
    );
    if (volunteerId) {
      await assignmentServiceDependencies.Volunteer.updateOne(
        { _id: volunteerId }, { $addToSet: { schedules: schedule._id } }
      );
    }

    const active = await assignmentServiceDependencies.Assignment.findOne({ activeSlotKey: slotKey });
    const activeMatches = Boolean(
      volunteerId && active && active.sourceType === "SCHEDULE" &&
      active.schedule?.toString() === schedule._id.toString() &&
      active.volunteer?.toString() === volunteerId && active.role === schedule.role
    );
    if (active && !activeMatches) await cancelActiveSlot(slotKey, actorId);
    if (volunteerId && !activeMatches) {
      if (!await assignmentServiceDependencies.Volunteer.exists({ _id: volunteerId })) {
        throw new AssignmentInputError("Assigned volunteer not found", 404);
      }
      try {
        await createAssignment({
          sourceType: "SCHEDULE", schedule: schedule._id, volunteer: volunteerId,
          role: schedule.role, scheduledBy: actorId, slotKey, sourceDocument: schedule
        });
      } catch (error) {
        if (!isDuplicateKey(error)) throw error;
      }
    }

    const latest = await authoritativeScheduleState(scheduleId);
    if (latest.volunteerId === volunteerId) {
      const finalActive = await assignmentServiceDependencies.Assignment.findOne({ activeSlotKey: slotKey });
      if ((!volunteerId && !finalActive) || (volunteerId &&
        finalActive?.volunteer?.toString() === volunteerId && finalActive?.role === latest.schedule.role)) {
        return latest.schedule;
      }
    }
  }
  throw new AssignmentInputError("Schedule assignment changed concurrently; retry required", 409);
}

export async function assignScheduleVolunteer(input: { scheduleId: string; volunteerId: string; scheduledBy: string }) {
  if (!mongoose.isValidObjectId(input.scheduleId) || !mongoose.isValidObjectId(input.volunteerId)) {
    throw new AssignmentInputError("Invalid schedule or volunteer ID");
  }
  if (!await assignmentServiceDependencies.Volunteer.exists({ _id: input.volunteerId })) {
    throw new AssignmentInputError("Volunteer not found", 404);
  }
  const schedule = await assignmentServiceDependencies.Schedule.findOneAndUpdate(
    { _id: input.scheduleId }, { $set: { volunteer: input.volunteerId } },
    { new: true, runValidators: true }
  );
  if (!schedule) throw new AssignmentInputError("Schedule not found", 404);
  const reconciled = await reconcileScheduleAssignment(input.scheduleId, input.scheduledBy);
  const winnerId = objectId(reconciled.volunteer);
  const winner = winnerId ? await assignmentServiceDependencies.Volunteer.findById(winnerId) : null;
  await updateScheduleSheet(reconciled, winner?.name || "");
  return { schedule: reconciled, won: winnerId === input.volunteerId };
}

export async function deassignScheduleVolunteer(input: { scheduleId: string; cancelledBy: string }) {
  if (!mongoose.isValidObjectId(input.scheduleId)) throw new AssignmentInputError("Invalid schedule ID");
  const schedule = await assignmentServiceDependencies.Schedule.findOneAndUpdate(
    { _id: input.scheduleId }, { $unset: { volunteer: 1 } },
    { new: true, runValidators: true }
  );
  if (!schedule) throw new AssignmentInputError("Schedule not found", 404);
  const reconciled = await reconcileScheduleAssignment(input.scheduleId, input.cancelledBy);
  const winnerId = objectId(reconciled.volunteer);
  const winner = winnerId ? await assignmentServiceDependencies.Volunteer.findById(winnerId) : null;
  await updateScheduleSheet(reconciled, winner?.name || "");
  return { schedule: reconciled, deassigned: !winnerId };
}

export async function deleteSchedules(filter: Record<string, unknown>, actorId: string) {
  const schedules = await assignmentServiceDependencies.Schedule.find(filter);
  let deletedCount = 0;
  for (const schedule of schedules) {
    await assignmentServiceDependencies.Schedule.updateOne(
      { _id: schedule._id }, { $unset: { volunteer: 1 } }, { runValidators: true }
    );
    await reconcileScheduleAssignment(schedule._id.toString(), actorId);
    const result = await assignmentServiceDependencies.Schedule.deleteOne({
      _id: schedule._id, volunteer: { $exists: false }
    });
    if (result.deletedCount !== 1) throw new AssignmentInputError("Schedule changed concurrently; deletion aborted", 409);
    deletedCount += 1;
  }
  return { deletedCount };
}

export async function validateEventAssignments(value: unknown): Promise<VolunteerMap> {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) throw new AssignmentInputError("assignedVolunteers must be an object");
  const input = value as Record<string, unknown>;
  const unsupported = Object.keys(input).filter(key => !EVENT_ASSIGNMENT_ROLES.includes(key as EventRole));
  if (unsupported.length) throw new AssignmentInputError(`Unsupported event role: ${unsupported[0]}`);
  const normalized: VolunteerMap = {};
  const ids = new Set<string>();
  for (const role of EVENT_ASSIGNMENT_ROLES) {
    const valueForRole = input[role];
    if (valueForRole === undefined || valueForRole === null || valueForRole === "") continue;
    if (valueForRole === "N/A" || valueForRole === "TBC") {
      normalized[role] = valueForRole;
      continue;
    }
    const id = objectId(valueForRole);
    if (!id) throw new AssignmentInputError(`Invalid volunteer for event role ${role}`);
    normalized[role] = id;
    ids.add(id);
  }
  for (const id of Array.from(ids)) {
    if (!await assignmentServiceDependencies.Volunteer.exists({ _id: id })) {
      throw new AssignmentInputError(`Volunteer ${id} not found`, 404);
    }
  }
  return normalized;
}

function eventAssignmentSnapshot(event: any) {
  const assigned = event.toObject ? event.toObject().assignedVolunteers || {} : event.assignedVolunteers || {};
  return EVENT_ASSIGNMENT_ROLES.map(role => `${role}:${objectId(assigned[role]) || ""}`).join("|");
}

export async function reconcileEventAssignments(eventId: string, actorId: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const event = await assignmentServiceDependencies.Event.findById(eventId);
    if (!event) {
      await cancelEventAssignments(eventId, actorId);
      throw new AssignmentInputError("Event not found", 404);
    }
    const snapshot = `${event.status}|${eventAssignmentSnapshot(event)}`;
    const assigned = event.toObject ? event.toObject().assignedVolunteers || {} : event.assignedVolunteers || {};
    for (const role of EVENT_ASSIGNMENT_ROLES) {
      const slotKey = eventSlotKey(event._id, role);
      const volunteerId = event.status === "cancelled" ? null : objectId(assigned[role]);
      const active = await assignmentServiceDependencies.Assignment.findOne({ activeSlotKey: slotKey });
      const matches = Boolean(volunteerId && active?.volunteer?.toString() === volunteerId && active?.role === role);
      if (active && !matches) await cancelActiveSlot(slotKey, actorId);
      if (volunteerId && !matches) {
        try {
          await createAssignment({
            sourceType: "EVENT", event: event._id, volunteer: volunteerId,
            role, scheduledBy: actorId, slotKey, sourceDocument: event
          });
        } catch (error) {
          if (!isDuplicateKey(error)) throw error;
        }
      }
    }
    const latest = await assignmentServiceDependencies.Event.findById(eventId);
    if (latest && `${latest.status}|${eventAssignmentSnapshot(latest)}` === snapshot) return latest;
  }
  throw new AssignmentInputError("Event assignments changed concurrently; retry required", 409);
}

export async function cancelEventAssignments(eventId: string, cancelledBy: string) {
  for (const role of EVENT_ASSIGNMENT_ROLES) await cancelActiveSlot(eventSlotKey(eventId, role), cancelledBy);
}

export async function deleteEvent(eventId: string, actorId: string) {
  const event = await assignmentServiceDependencies.Event.findById(eventId);
  if (!event) {
    await cancelEventAssignments(eventId, actorId);
    throw new AssignmentInputError("Event not found", 404);
  }
  const cleanup = {
    eventName: event.eventName,
    googleCalendarEventId: event.googleCalendarEventId || null
  };
  await cancelEventAssignments(eventId, actorId);
  const result = await assignmentServiceDependencies.Event.deleteOne({ _id: event._id });
  if (result.deletedCount !== 1) throw new AssignmentInputError("Event changed concurrently; deletion aborted", 409);
  await cancelEventAssignments(eventId, actorId);
  return cleanup;
}

export async function transitionAssignment(input: {
  assignmentId: string; expectedVersion: number;
  expectedStatus: "PENDING" | "CONFIRMED" | "DECLINED" | "CHANGE_REQUESTED";
  nextStatus: "CONFIRMED" | "DECLINED" | "CHANGE_REQUESTED";
  actorType: "VOLUNTEER" | "ADMIN" | "SYSTEM"; actorId?: string; channel: "WEB" | "ADMIN";
}) {
  const now = new Date();
  return assignmentServiceDependencies.Assignment.findOneAndUpdate(
    { _id: input.assignmentId, version: input.expectedVersion, status: input.expectedStatus },
    {
      $set: { status: input.nextStatus, respondedAt: now, responseChannel: input.channel },
      $inc: { version: 1 },
      $push: { responseHistory: {
        action: input.nextStatus, actorType: input.actorType,
        ...(input.actorId ? { actorId: input.actorId } : {}), channel: input.channel, at: now
      } }
    },
    { new: true, runValidators: true }
  );
}
