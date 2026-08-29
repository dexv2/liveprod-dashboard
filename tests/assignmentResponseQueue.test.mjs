import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import mongoose from "mongoose";
import Assignment from "../models/assignment.ts";
import {
  assignmentResponseQueueDependencies,
  getAssignmentResponseQueue,
  parseAssignmentResponseQueueFilters
} from "../services/assignments/assignmentResponseQueueService.ts";

const adminA = new mongoose.Types.ObjectId();
const adminB = new mongoose.Types.ObjectId();
const volunteerId = new mongoose.Types.ObjectId();
const scheduleId = new mongoose.Types.ObjectId();
const eventId = new mongoose.Types.ObjectId();

function chain(value) {
  return {
    sort() { return this; },
    limit() { return this; },
    select() { return this; },
    async lean() { return value; }
  };
}

function harness() {
  const assignments = [
    { _id: new mongoose.Types.ObjectId(), scheduledBy: adminA, sourceType: "SCHEDULE", schedule: scheduleId, volunteer: volunteerId, role: "foh", status: "PENDING", scheduledAt: new Date("2026-08-20Z"), lastNotificationStatus: "FAILED", lastNotificationErrorCode: "SECRET_PROVIDER_DETAIL", telegramMessageId: "777" },
    { _id: new mongoose.Types.ObjectId(), scheduledBy: adminA, sourceType: "EVENT", event: eventId, volunteer: volunteerId, role: "bcMix", status: "CHANGE_REQUESTED", scheduledAt: new Date("2026-08-21Z"), respondedAt: new Date("2026-08-29Z"), lastNotificationStatus: "SENT" },
    { _id: new mongoose.Types.ObjectId(), scheduledBy: adminA, sourceType: "SCHEDULE", schedule: new mongoose.Types.ObjectId(), volunteer: volunteerId, role: "mon mix", status: "DECLINED", scheduledAt: new Date("2026-08-22Z"), respondedAt: new Date("2026-08-28Z") },
    { _id: new mongoose.Types.ObjectId(), scheduledBy: adminA, sourceType: "SCHEDULE", schedule: scheduleId, volunteer: volunteerId, role: "foh", status: "CONFIRMED", scheduledAt: new Date("2026-08-23Z") },
    { _id: new mongoose.Types.ObjectId(), scheduledBy: adminA, sourceType: "SCHEDULE", schedule: scheduleId, volunteer: volunteerId, role: "foh", status: "CANCELLED", scheduledAt: new Date("2026-08-24Z") },
    { _id: new mongoose.Types.ObjectId(), scheduledBy: adminB, sourceType: "SCHEDULE", schedule: scheduleId, volunteer: volunteerId, role: "foh", status: "PENDING", scheduledAt: new Date("2026-08-25Z") }
  ];
  let assignmentQuery;
  Object.assign(assignmentResponseQueueDependencies, {
    Assignment: {
      find(query) {
        assignmentQuery = query;
        const selected = assignments.filter(item => item.scheduledBy.toString() === query.scheduledBy.toString() &&
          query.status.$in.includes(item.status) && (!query.sourceType || item.sourceType === query.sourceType));
        return chain(selected);
      }
    },
    Volunteer: { find() { return chain([{ _id: volunteerId, name: "Volunteer X", telegram: { userId: "must-not-leak" } }]); } },
    Schedule: { find() { return chain([{ _id: scheduleId, date: new Date("2026-09-02T00:00:00Z"), service: "sunday1", role: "foh" }]); } },
    Event: { find() { return chain([{ _id: eventId, date: new Date("2026-09-01T00:00:00Z"), eventName: "Worship Night", callTime: "5:00 PM" }]); } }
  });
  return { assignments, query: () => assignmentQuery };
}

test("My Responses query is server-owned, cancelled is hidden, and summary/priority are correct", async () => {
  const h = harness();
  const result = await getAssignmentResponseQueue(adminA.toString(), {}, new Date("2026-08-29T00:00:00Z"));
  assert.equal(h.query().scheduledBy, adminA.toString());
  assert.equal(result.items.some(item => item.status === "CANCELLED"), false);
  assert.equal(result.items.some(item => item.volunteer.name === "Volunteer X"), true);
  assert.deepEqual(result.summary, { pending: 1, confirmed: 1, declined: 1, changeRequested: 1 });
  assert.deepEqual(result.items.map(item => item.status), ["CHANGE_REQUESTED", "DECLINED", "PENDING", "CONFIRMED"]);
});
test("Schedule/Event DTOs resolve source fields and deleted sources remain safe", async () => {
  harness();
  const result = await getAssignmentResponseQueue(adminA.toString(), {}, new Date("2026-08-29T00:00:00Z"));
  const schedule = result.items.find(item => item.status === "PENDING");
  const event = result.items.find(item => item.status === "CHANGE_REQUESTED");
  const missing = result.items.find(item => item.status === "DECLINED");
  assert.deepEqual({ title: schedule.source.title, service: schedule.source.service }, { title: "sunday1 service", service: "sunday1" });
  assert.deepEqual({ title: event.source.title, callTime: event.source.callTime }, { title: "Worship Night", callTime: "5:00 PM" });
  assert.deepEqual(missing.source, { available: false, title: "Source no longer available" });
});

test("status, source, and date filters are validated and applied", async () => {
  harness();
  const filters = parseAssignmentResponseQueueFilters(new URLSearchParams("status=PENDING&sourceType=SCHEDULE&from=2026-09-01&to=2026-09-03"));
  const result = await getAssignmentResponseQueue(adminA.toString(), filters);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].status, "PENDING");
  await assert.rejects(async () => parseAssignmentResponseQueueFilters(new URLSearchParams("status=INVENTED")), /INVALID_STATUS/);
  await assert.rejects(async () => parseAssignmentResponseQueueFilters(new URLSearchParams("from=2026-10-01&to=2026-09-01")), /INVALID_DATE_RANGE/);
});

test("response DTO exposes only sanitized delivery state and no Telegram/token internals", async () => {
  harness();
  const result = await getAssignmentResponseQueue(adminA.toString(), {}, new Date("2026-08-29T00:00:00Z"));
  const serialized = JSON.stringify(result);
  assert.equal(result.items.find(item => item.status === "PENDING").notification.status, "FAILED");
  for (const secret of ["must-not-leak", "SECRET_PROVIDER_DETAIL", "telegramMessageId", "tokenHash", "chatId", "userId"]) {
    assert.equal(serialized.includes(secret), false);
  }
});

test("response API derives Admin identity from auth and UI reuses secure notify route with polling", async () => {
  const route = await readFile(new URL("../app/api/assignments/responses/route.ts", import.meta.url), "utf8");
  const ui = await readFile(new URL("../components/client/CCAssignmentResponseQueue.tsx", import.meta.url), "utf8");
  assert.match(route, /requireAssignmentAdmin\(await auth\(\)\)/);
  assert.match(route, /getAssignmentResponseQueue\(adminId, filters\)/);
  assert.doesNotMatch(route, /searchParams\.get\(["']scheduledBy/);
  assert.match(ui, /\/api\/assignments\/\$\{item\.assignmentId\}\/notify/);
  assert.match(ui, /window\.setInterval\(.*15000/);
  assert.match(ui, /window\.clearInterval/);
});

test("Assignment includes the scheduler queue compound index", () => {
  const index = Assignment.schema.indexes().find(([fields]) => fields.scheduledBy === 1 && fields.status === 1);
  assert.equal(index?.[0].scheduledAt, -1);
});
