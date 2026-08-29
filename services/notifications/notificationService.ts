import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import Assignment, { ACTIVE_ASSIGNMENT_STATUSES } from "@/models/assignment";
import Event from "@/models/event";
import Schedule from "@/models/schedule";
import Volunteer from "@/models/volunteer";
import {
  NotificationProviderError,
  sendTelegramNotification
} from "@/services/notifications/providers/telegramProvider";

export type AssignmentNotificationStatus =
  | "SENT" | "FAILED" | "SKIPPED_NO_LINK" | "SKIPPED_DISABLED" | "PROCESSING";

export class AssignmentNotificationError extends Error {
  status: 400 | 404 | 409;
  code: string;
  constructor(message: string, status: AssignmentNotificationError["status"], code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const notificationServiceDependencies: any = {
  Assignment,
  Event,
  Schedule,
  Volunteer,
  sendTelegramNotification,
  now: () => new Date(),
  randomUUID,
  logger: console
};

const manilaDate = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila", year: "numeric", month: "long", day: "numeric", weekday: "long"
});
const MANUAL_PROCESSING_RETRY_AFTER_MS = 10 * 60 * 1000;

export function buildAssignmentMessage(assignment: any, source: any) {
  const lines = ["CCF Live Production", "", "You have been scheduled:", ""];
  if (assignment.sourceType === "SCHEDULE") {
    lines.push(
      `Date: ${manilaDate.format(new Date(source.date))}`,
      `Service: ${source.service}`,
      `Role: ${assignment.role}`
    );
  } else {
    lines.push(
      `Event: ${source.eventName}`,
      `Date: ${manilaDate.format(new Date(source.date))}`,
      ...(source.callTime ? [`Call Time: ${source.callTime}`] : []),
      `Role: ${assignment.role}`
    );
  }
  lines.push("", "Please check your schedule in the CCF Live Production app.");
  return lines.join("\n");
}

async function loadValidatedContext(assignmentId: string) {
  if (!mongoose.isValidObjectId(assignmentId)) {
    throw new AssignmentNotificationError("Invalid assignment ID", 400, "INVALID_ASSIGNMENT_ID");
  }
  const assignment = await notificationServiceDependencies.Assignment.findById(assignmentId);
  if (!assignment) throw new AssignmentNotificationError("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");
  if (!ACTIVE_ASSIGNMENT_STATUSES.includes(assignment.status) || assignment.activeSlotKey !== assignment.slotKey) {
    throw new AssignmentNotificationError("Assignment is not active", 409, "ASSIGNMENT_INACTIVE");
  }
  const source = assignment.sourceType === "SCHEDULE"
    ? await notificationServiceDependencies.Schedule.findById(assignment.schedule)
    : await notificationServiceDependencies.Event.findById(assignment.event);
  if (!source) throw new AssignmentNotificationError("Assignment source no longer exists", 409, "SOURCE_MISSING");
  const sourceVolunteer = assignment.sourceType === "SCHEDULE"
    ? source.volunteer
    : source.status === "cancelled" ? null : source.assignedVolunteers?.[assignment.role];
  if (sourceVolunteer?.toString() !== assignment.volunteer.toString()) {
    throw new AssignmentNotificationError("Assignment source no longer matches", 409, "SOURCE_MISMATCH");
  }
  const volunteer = await notificationServiceDependencies.Volunteer.findById(assignment.volunteer);
  if (!volunteer) throw new AssignmentNotificationError("Volunteer not found", 409, "VOLUNTEER_MISSING");
  return { assignment, source, volunteer };
}

async function recordSkipped(assignment: any, status: "SKIPPED_NO_LINK" | "SKIPPED_DISABLED", at: Date) {
  await notificationServiceDependencies.Assignment.updateOne(
    { _id: assignment._id, version: assignment.version, activeSlotKey: assignment.slotKey },
    {
      $set: {
        notificationDeliveryState: "SKIPPED",
        lastNotificationStatus: status,
        lastNotificationAt: at,
        notificationKey: `ASSIGNMENT_CREATED:${assignment._id}:${assignment.version}`
      },
      $unset: {
        notificationClaimedAt: 1, notificationAttemptId: 1,
        lastNotificationErrorCode: 1
      }
    },
    { runValidators: true }
  );
  return { status } as { status: AssignmentNotificationStatus };
}

export async function notifyAssignment(assignmentId: string, options: { manual?: boolean } = {}) {
  const { assignment, source, volunteer } = await loadValidatedContext(assignmentId);
  const now = notificationServiceDependencies.now();
  if (!volunteer.telegram?.userId || !volunteer.telegram?.chatId) {
    return recordSkipped(assignment, "SKIPPED_NO_LINK", now);
  }
  if (volunteer.active === false || !volunteer.telegram.notificationsEnabled) {
    return recordSkipped(assignment, "SKIPPED_DISABLED", now);
  }

  const notificationKey = `ASSIGNMENT_CREATED:${assignment._id}:${assignment.version}`;
  const attemptId = notificationServiceDependencies.randomUUID();
  const filter: any = {
    _id: assignment._id,
    version: assignment.version,
    activeSlotKey: assignment.slotKey
  };
  if (options.manual) {
    filter.$or = [
      { notificationDeliveryState: { $ne: "PROCESSING" } },
      {
        notificationDeliveryState: "PROCESSING",
        notificationClaimedAt: { $lt: new Date(now.getTime() - MANUAL_PROCESSING_RETRY_AFTER_MS) }
      }
    ];
  } else {
    filter.notificationDeliveryState = { $ne: "PROCESSING" };
    filter.$or = [
      { notificationKey: { $ne: notificationKey } },
      { lastNotificationStatus: { $ne: "SENT" } }
    ];
  }
  const claimed = await notificationServiceDependencies.Assignment.findOneAndUpdate(
    filter,
    {
      $set: {
        notificationDeliveryState: "PROCESSING",
        notificationClaimedAt: now,
        notificationAttemptId: attemptId,
        notificationKey
      },
      $inc: { notificationAttempts: 1 },
      $unset: { lastNotificationErrorCode: 1 }
    },
    { new: true, runValidators: true }
  );
  if (!claimed) {
    const latest = await notificationServiceDependencies.Assignment.findById(assignment._id);
    if (latest?.notificationDeliveryState === "PROCESSING") {
      return { status: "PROCESSING" as AssignmentNotificationStatus };
    }
    if (!options.manual && latest?.notificationKey === notificationKey && latest?.lastNotificationStatus === "SENT") {
      return { status: "SENT" as AssignmentNotificationStatus, duplicate: true };
    }
    throw new AssignmentNotificationError("Notification could not be claimed", 409, "DELIVERY_CONFLICT");
  }

  try {
    const delivery = await notificationServiceDependencies.sendTelegramNotification(
      volunteer.telegram.chatId,
      buildAssignmentMessage(assignment, source)
    );
    try {
      await notificationServiceDependencies.Assignment.updateOne(
        { _id: assignment._id, notificationAttemptId: attemptId, notificationDeliveryState: "PROCESSING" },
        {
          $set: {
            notificationDeliveryState: "SENT",
            lastNotificationStatus: "SENT",
            ...(!assignment.notificationSentAt ? { notificationSentAt: now } : {}),
            lastNotificationAt: now,
            telegramMessageId: delivery.messageId
          },
          $unset: { notificationClaimedAt: 1, notificationAttemptId: 1, lastNotificationErrorCode: 1 }
        },
        { runValidators: true }
      );
    } catch {
      notificationServiceDependencies.logger.error("Assignment notification outcome unknown", {
        assignmentId: assignment._id.toString(), attemptId, provider: "TELEGRAM"
      });
      return { status: "PROCESSING" as AssignmentNotificationStatus, outcomeUnknown: true };
    }
    return { status: "SENT" as AssignmentNotificationStatus, messageId: delivery.messageId };
  } catch (error) {
    const code = error instanceof NotificationProviderError ? error.code : "TELEGRAM_API_ERROR";
    try {
      await notificationServiceDependencies.Assignment.updateOne(
        { _id: assignment._id, notificationAttemptId: attemptId, notificationDeliveryState: "PROCESSING" },
        {
          $set: {
            notificationDeliveryState: "FAILED",
            lastNotificationStatus: "FAILED",
            lastNotificationAt: now,
            lastNotificationErrorCode: code
          },
          $unset: { notificationClaimedAt: 1, notificationAttemptId: 1 }
        },
        { runValidators: true }
      );
    } catch {
      notificationServiceDependencies.logger.error("Assignment notification failure metadata unavailable", {
        assignmentId: assignment._id.toString(), attemptId, provider: "TELEGRAM", errorCode: code
      });
    }
    return { status: "FAILED" as AssignmentNotificationStatus, errorCode: code };
  }
}

export async function notifyAssignmentSafely(assignmentId: string) {
  try {
    return await notifyAssignment(assignmentId);
  } catch (error) {
    notificationServiceDependencies.logger.error("Automatic assignment notification skipped", {
      assignmentId,
      errorCode: error instanceof AssignmentNotificationError ? error.code : "NOTIFICATION_ERROR"
    });
    return { status: "FAILED" as AssignmentNotificationStatus };
  }
}

export const ASSIGNMENT_NOTIFICATION_POLICY = {
  manualProcessingRetryAfterMinutes: MANUAL_PROCESSING_RETRY_AFTER_MS / 60000
};
