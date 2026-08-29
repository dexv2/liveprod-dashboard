import { createHash, randomBytes } from "node:crypto";
import mongoose from "mongoose";
import Volunteer from "@/models/volunteer";
import TelegramLinkToken, { TELEGRAM_LINK_TOKEN_TTL_MINUTES } from "@/models/telegramLinkToken";

const MAX_ISSUES_PER_WINDOW = 5;
const ISSUE_WINDOW_MS = 10 * 60 * 1000;

export class TelegramLinkError extends Error {
  status: 400 | 404 | 409 | 429 | 500;
  code: string;
  constructor(message: string, status: TelegramLinkError["status"], code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const telegramLinkDependencies: any = {
  Volunteer,
  TelegramLinkToken,
  randomBytes,
  now: () => new Date()
};

export function hashTelegramLinkToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function statusFromVolunteer(volunteer: any, pendingLink?: any) {
  const telegram = volunteer?.telegram;
  return {
    connected: Boolean(telegram?.userId && telegram?.chatId),
    ...(telegram?.linkedAt ? { linkedAt: telegram.linkedAt } : {}),
    notificationsEnabled: Boolean(telegram?.notificationsEnabled),
    ...(pendingLink ? { pendingLink: { expiresAt: pendingLink.expiresAt } } : {})
  };
}

function assertVolunteerId(volunteerId: string) {
  if (!mongoose.isValidObjectId(volunteerId)) {
    throw new TelegramLinkError("Invalid volunteer ID", 400, "INVALID_VOLUNTEER_ID");
  }
}

export async function generateTelegramLink(input: { volunteerId: string; createdBy: string }) {
  assertVolunteerId(input.volunteerId);
  const username = process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  if (!username || !/^[A-Za-z0-9_]{5,32}$/.test(username)) {
    throw new TelegramLinkError("Telegram bot username is not configured", 500, "BOT_NOT_CONFIGURED");
  }
  const now = telegramLinkDependencies.now();
  const volunteer = await telegramLinkDependencies.Volunteer.findById(input.volunteerId);
  if (!volunteer) throw new TelegramLinkError("Volunteer not found", 404, "VOLUNTEER_NOT_FOUND");

  const issued = await telegramLinkDependencies.TelegramLinkToken.countDocuments({
    volunteer: input.volunteerId,
    createdBy: input.createdBy,
    createdAt: { $gt: new Date(now.getTime() - ISSUE_WINDOW_MS) }
  });
  if (issued >= MAX_ISSUES_PER_WINDOW) {
    throw new TelegramLinkError("Too many connection links generated. Please try again later.", 429, "RATE_LIMITED");
  }

  await telegramLinkDependencies.TelegramLinkToken.updateMany(
    { volunteer: input.volunteerId, state: "UNUSED", invalidatedAt: { $exists: false } },
    { $set: { invalidatedAt: now } }
  );
  const token = telegramLinkDependencies.randomBytes(24).toString("base64url");
  const expiresAt = new Date(now.getTime() + TELEGRAM_LINK_TOKEN_TTL_MINUTES * 60 * 1000);
  await telegramLinkDependencies.TelegramLinkToken.create({
    tokenHash: hashTelegramLinkToken(token),
    volunteer: input.volunteerId,
    createdBy: input.createdBy,
    state: "UNUSED",
    createdAt: now,
    expiresAt
  });
  return {
    link: `https://t.me/${username}?start=${token}`,
    expiresAt,
    ...statusFromVolunteer(volunteer)
  };
}

export async function getTelegramLinkStatus(volunteerId: string) {
  assertVolunteerId(volunteerId);
  const volunteer = await telegramLinkDependencies.Volunteer.findById(volunteerId);
  if (!volunteer) throw new TelegramLinkError("Volunteer not found", 404, "VOLUNTEER_NOT_FOUND");
  const pendingLink = await telegramLinkDependencies.TelegramLinkToken.findOne({
    volunteer: volunteerId,
    state: "UNUSED",
    invalidatedAt: { $exists: false },
    expiresAt: { $gt: telegramLinkDependencies.now() }
  });
  return statusFromVolunteer(volunteer, pendingLink);
}

export async function unlinkVolunteerTelegram(volunteerId: string) {
  assertVolunteerId(volunteerId);
  const now = telegramLinkDependencies.now();
  const existing = await telegramLinkDependencies.Volunteer.findById(volunteerId);
  if (!existing) throw new TelegramLinkError("Volunteer not found", 404, "VOLUNTEER_NOT_FOUND");
  await telegramLinkDependencies.TelegramLinkToken.updateMany(
    {
      volunteer: volunteerId,
      state: { $in: ["UNUSED", "PROCESSING"] },
      invalidatedAt: { $exists: false }
    },
    { $set: { invalidatedAt: now } }
  );
  const volunteer = await telegramLinkDependencies.Volunteer.findByIdAndUpdate(
    volunteerId,
    {
      $unset: { "telegram.userId": 1, "telegram.chatId": 1, "telegram.linkedAt": 1 },
      $set: { "telegram.notificationsEnabled": false },
      $inc: { "telegram.linkVersion": 1 }
    },
    { new: true, runValidators: true }
  );
  if (!volunteer) throw new TelegramLinkError("Volunteer not found", 404, "VOLUNTEER_NOT_FOUND");
  return statusFromVolunteer(volunteer);
}

function duplicateKey(error: any) {
  return error?.code === 11000;
}

export async function linkVolunteerFromTelegram(input: {
  token: string;
  telegramUserId: string;
  telegramChatId: string;
  chatType: string;
}) {
  if (input.chatType !== "private") {
    throw new TelegramLinkError("Please open this bot in a private chat to connect your account.", 400, "PRIVATE_CHAT_REQUIRED");
  }
  const now = telegramLinkDependencies.now();
  const tokenHash = hashTelegramLinkToken(input.token);
  let claim = await telegramLinkDependencies.TelegramLinkToken.findOneAndUpdate(
    {
      tokenHash,
      state: "UNUSED",
      invalidatedAt: { $exists: false },
      expiresAt: { $gt: now }
    },
    {
      $set: {
        state: "PROCESSING",
        processingAt: now,
        processingTelegramUserId: input.telegramUserId,
        processingTelegramChatId: input.telegramChatId
      }
    },
    { new: true }
  );
  if (!claim) {
    claim = await telegramLinkDependencies.TelegramLinkToken.findOne({
      tokenHash,
      state: "PROCESSING",
      invalidatedAt: { $exists: false },
      expiresAt: { $gt: now },
      processingTelegramUserId: input.telegramUserId,
      processingTelegramChatId: input.telegramChatId
    });
  }
  if (!claim) {
    const usedClaim = await telegramLinkDependencies.TelegramLinkToken.findOne({
      tokenHash,
      state: "USED",
      usedByTelegramUserId: input.telegramUserId
    });
    if (usedClaim) {
      const linkedVolunteer = await telegramLinkDependencies.Volunteer.findOne({
        _id: usedClaim.volunteer,
        "telegram.userId": input.telegramUserId,
        "telegram.chatId": input.telegramChatId
      });
      if (linkedVolunteer) return { connected: true, idempotent: true };
    }
  }
  if (!claim) {
    throw new TelegramLinkError("This connection link is invalid or no longer available.", 400, "TOKEN_UNAVAILABLE");
  }

  const volunteer = await telegramLinkDependencies.Volunteer.findById(claim.volunteer);
  if (!volunteer) {
    await telegramLinkDependencies.TelegramLinkToken.updateOne(
      { _id: claim._id, state: "PROCESSING" },
      { $set: { invalidatedAt: now } }
    );
    throw new TelegramLinkError("This connection link is invalid or no longer available.", 400, "TOKEN_UNAVAILABLE");
  }
  const collision = await telegramLinkDependencies.Volunteer.findOne({
    _id: { $ne: volunteer._id },
    "telegram.userId": input.telegramUserId
  });
  if (collision) {
    throw new TelegramLinkError(
      "This Telegram account is already connected. Please contact an administrator.",
      409,
      "TELEGRAM_ACCOUNT_COLLISION"
    );
  }

  const stillAuthorized = await telegramLinkDependencies.TelegramLinkToken.findOne({
    _id: claim._id,
    state: "PROCESSING",
    invalidatedAt: { $exists: false },
    expiresAt: { $gt: now },
    processingTelegramUserId: input.telegramUserId,
    processingTelegramChatId: input.telegramChatId
  });
  if (!stillAuthorized) {
    throw new TelegramLinkError("This connection link is invalid or no longer available.", 400, "TOKEN_UNAVAILABLE");
  }

  const alreadyLinked = volunteer.telegram?.userId === input.telegramUserId &&
    volunteer.telegram?.chatId === input.telegramChatId;
  if (!alreadyLinked) {
    const currentVersion = volunteer.telegram?.linkVersion ?? 0;
    try {
      const updated = await telegramLinkDependencies.Volunteer.findOneAndUpdate(
        {
          _id: volunteer._id,
          $or: [
            { "telegram.linkVersion": currentVersion },
            ...(currentVersion === 0 ? [{ "telegram.linkVersion": { $exists: false } }] : [])
          ]
        },
        {
          $set: {
            "telegram.userId": input.telegramUserId,
            "telegram.chatId": input.telegramChatId,
            "telegram.linkedAt": now,
            "telegram.notificationsEnabled": true
          },
          $inc: { "telegram.linkVersion": 1 }
        },
        { new: true, runValidators: true }
      );
      if (!updated) throw new TelegramLinkError("Connection changed concurrently. Please retry.", 409, "LINK_CONFLICT");
    } catch (error) {
      if (duplicateKey(error)) {
        throw new TelegramLinkError(
          "This Telegram account is already connected. Please contact an administrator.",
          409,
          "TELEGRAM_ACCOUNT_COLLISION"
        );
      }
      throw error;
    }
  }

  const finalized = await telegramLinkDependencies.TelegramLinkToken.findOneAndUpdate(
    {
      _id: claim._id,
      state: "PROCESSING",
      processingTelegramUserId: input.telegramUserId,
      processingTelegramChatId: input.telegramChatId
    },
    {
      $set: { state: "USED", usedAt: now, usedByTelegramUserId: input.telegramUserId },
      $unset: { processingAt: 1, processingTelegramUserId: 1, processingTelegramChatId: 1 }
    },
    { new: true }
  );
  if (!finalized) throw new TelegramLinkError("Unable to complete connection. Please retry.", 500, "FINALIZE_FAILED");
  return { connected: true };
}

export const TELEGRAM_LINK_POLICY = {
  expiryMinutes: TELEGRAM_LINK_TOKEN_TTL_MINUTES,
  maxIssuesPerWindow: MAX_ISSUES_PER_WINDOW,
  issueWindowMinutes: ISSUE_WINDOW_MS / 60000
};
