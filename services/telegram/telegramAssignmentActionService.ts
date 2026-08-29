import { createHash, randomBytes } from "node:crypto";
import Assignment from "@/models/assignment";
import Event from "@/models/event";
import Schedule from "@/models/schedule";
import TelegramAssignmentAction, { TELEGRAM_ASSIGNMENT_ACTIONS } from "@/models/telegramAssignmentAction";
import Volunteer from "@/models/volunteer";

export type TelegramAssignmentActionName = typeof TELEGRAM_ASSIGNMENT_ACTIONS[number];

export const telegramAssignmentActionDependencies: any = {
  Assignment,
  Event,
  Schedule,
  TelegramAssignmentAction,
  Volunteer,
  transitionAssignment: async (input: any) => Assignment.findOneAndUpdate(
    {
      _id: input.assignmentId,
      version: input.expectedVersion,
      status: "PENDING",
      volunteer: input.volunteerId
    },
    {
      $set: { status: input.nextStatus, respondedAt: input.at, responseChannel: "TELEGRAM" },
      $inc: { version: 1 },
      $push: { responseHistory: {
        action: input.nextStatus,
        actorType: "VOLUNTEER",
        actorId: input.volunteerId,
        channel: "TELEGRAM",
        at: input.at
      } }
    },
    { new: true, runValidators: true }
  ),
  randomBytes,
  now: () => new Date(),
  logger: console
};

export function hashTelegramAssignmentActionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function manilaDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(value);
  const part = (type: string) => parts.find(item => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function tokenExpiry(sourceDate: Date) {
  return new Date(new Date(sourceDate).getTime() + 2 * 24 * 60 * 60 * 1000);
}

export async function issueAssignmentActionTokens(input: {
  assignment: any;
  volunteer: any;
  source: any;
  notificationAttemptId: string;
}) {
  const now = telegramAssignmentActionDependencies.now();
  await telegramAssignmentActionDependencies.TelegramAssignmentAction.updateMany(
    {
      assignment: input.assignment._id,
      assignmentVersion: input.assignment.version,
      volunteer: input.assignment.volunteer,
      usedAt: { $exists: false },
      invalidatedAt: { $exists: false }
    },
    { $set: { invalidatedAt: now } }
  );
  if (input.assignment.status !== "PENDING" || manilaDateKey(new Date(input.source.date)) < manilaDateKey(now)) {
    return { attemptId: input.notificationAttemptId, buttons: [] };
  }
  const plaintext: Partial<Record<TelegramAssignmentActionName, string>> = {};
  const documents = TELEGRAM_ASSIGNMENT_ACTIONS.map(action => {
    const token = telegramAssignmentActionDependencies.randomBytes(24).toString("base64url");
    plaintext[action] = token;
    return {
      tokenHash: hashTelegramAssignmentActionToken(token),
      assignment: input.assignment._id,
      assignmentVersion: input.assignment.version,
      volunteer: input.assignment.volunteer,
      volunteerLinkVersion: input.volunteer.telegram.linkVersion,
      action,
      notificationAttemptId: input.notificationAttemptId,
      createdAt: now,
      expiresAt: tokenExpiry(input.source.date)
    };
  });
  try {
    await telegramAssignmentActionDependencies.TelegramAssignmentAction.insertMany(documents);
  } catch (error) {
    await telegramAssignmentActionDependencies.TelegramAssignmentAction.updateMany(
      { notificationAttemptId: input.notificationAttemptId },
      { $set: { invalidatedAt: now } }
    );
    throw error;
  }
  return {
    attemptId: input.notificationAttemptId,
    buttons: [
      { text: "✅ Accept", callbackData: `a:${plaintext.ACCEPT}` },
      { text: "❌ Decline", callbackData: `a:${plaintext.DECLINE}` },
      { text: "🔄 Request Change", callbackData: `a:${plaintext.REQUEST_CHANGE}` }
    ]
  };
}

export async function invalidateAssignmentActionAttempt(attemptId: string) {
  await telegramAssignmentActionDependencies.TelegramAssignmentAction.updateMany(
    { notificationAttemptId: attemptId, usedAt: { $exists: false }, invalidatedAt: { $exists: false } },
    { $set: { invalidatedAt: telegramAssignmentActionDependencies.now() } }
  );
}

export type AssignmentActionResult = {
  outcome: "SUCCESS" | "RESPONDED" | "CHANGED" | "UNAVAILABLE";
  acknowledgement: string;
  messageStatus?: string;
};

const actionTarget = {
  ACCEPT: { status: "CONFIRMED", acknowledgement: "Schedule confirmed.", messageStatus: "✅ Confirmed" },
  DECLINE: { status: "DECLINED", acknowledgement: "Schedule declined.", messageStatus: "❌ Declined" },
  REQUEST_CHANGE: { status: "CHANGE_REQUESTED", acknowledgement: "Change request sent.", messageStatus: "🔄 Change requested" }
} as const;

export async function respondToAssignmentAction(input: { token: string; telegramUserId: string }): Promise<AssignmentActionResult> {
  const now = telegramAssignmentActionDependencies.now();
  const tokenHash = hashTelegramAssignmentActionToken(input.token);
  const actionToken = await telegramAssignmentActionDependencies.TelegramAssignmentAction.findOne({
    tokenHash,
    usedAt: { $exists: false },
    invalidatedAt: { $exists: false },
    expiresAt: { $gt: now }
  });
  if (!actionToken) {
    return { outcome: "UNAVAILABLE", acknowledgement: "This action is no longer available." };
  }
  const volunteer = await telegramAssignmentActionDependencies.Volunteer.findById(actionToken.volunteer);
  if (!volunteer?.telegram?.userId ||
      volunteer.telegram.userId !== input.telegramUserId ||
      volunteer.telegram.linkVersion !== actionToken.volunteerLinkVersion) {
    return { outcome: "UNAVAILABLE", acknowledgement: "This action is no longer available." };
  }
  const assignment = await telegramAssignmentActionDependencies.Assignment.findById(actionToken.assignment);
  if (!assignment || assignment.volunteer?.toString() !== actionToken.volunteer.toString() || assignment.status === "CANCELLED") {
    return { outcome: "UNAVAILABLE", acknowledgement: "This action is no longer available." };
  }
  if (assignment.status !== "PENDING") {
    return { outcome: "RESPONDED", acknowledgement: "This assignment has already been responded to." };
  }
  if (assignment.version !== actionToken.assignmentVersion) {
    return { outcome: "CHANGED", acknowledgement: "This schedule has changed. Please check the latest assignment." };
  }
  const source = assignment.sourceType === "SCHEDULE"
    ? await telegramAssignmentActionDependencies.Schedule.findById(assignment.schedule)
    : await telegramAssignmentActionDependencies.Event.findById(assignment.event);
  const sourceVolunteer = assignment.sourceType === "SCHEDULE"
    ? source?.volunteer
    : source?.status === "cancelled" ? null : source?.assignedVolunteers?.[assignment.role];
  if (!source || sourceVolunteer?.toString() !== assignment.volunteer.toString()) {
    return { outcome: "CHANGED", acknowledgement: "This schedule has changed. Please check the latest assignment." };
  }
  if (manilaDateKey(new Date(source.date)) < manilaDateKey(now)) {
    return { outcome: "UNAVAILABLE", acknowledgement: "This action is no longer available." };
  }
  const target = actionTarget[actionToken.action as TelegramAssignmentActionName];
  if (!target) return { outcome: "UNAVAILABLE", acknowledgement: "This action is no longer available." };
  const transitioned = await telegramAssignmentActionDependencies.transitionAssignment({
    assignmentId: assignment._id.toString(),
    expectedVersion: actionToken.assignmentVersion,
    nextStatus: target.status,
    volunteerId: volunteer._id.toString(),
    at: now
  });
  if (!transitioned) {
    const latest = await telegramAssignmentActionDependencies.Assignment.findById(assignment._id);
    return latest?.status === "PENDING"
      ? { outcome: "CHANGED", acknowledgement: "This schedule has changed. Please check the latest assignment." }
      : { outcome: "RESPONDED", acknowledgement: "This assignment has already been responded to." };
  }
  try {
    await telegramAssignmentActionDependencies.TelegramAssignmentAction.updateOne(
      { _id: actionToken._id, usedAt: { $exists: false } },
      { $set: { usedAt: now, telegramUserId: input.telegramUserId } }
    );
    await telegramAssignmentActionDependencies.TelegramAssignmentAction.updateMany(
      {
        assignment: assignment._id,
        assignmentVersion: actionToken.assignmentVersion,
        volunteer: volunteer._id,
        _id: { $ne: actionToken._id },
        usedAt: { $exists: false },
        invalidatedAt: { $exists: false }
      },
      { $set: { invalidatedAt: now } }
    );
  } catch {
    telegramAssignmentActionDependencies.logger.error("Telegram assignment action cleanup failed", {
      assignmentId: assignment._id.toString()
    });
  }
  return {
    outcome: "SUCCESS",
    acknowledgement: target.acknowledgement,
    messageStatus: target.messageStatus
  };
}

export const TELEGRAM_ASSIGNMENT_RESPONSE_POLICY = {
  callbackPrefix: "a:",
  responseCutoff: "Responses are accepted through the Schedule/Event calendar date in Asia/Manila."
};
