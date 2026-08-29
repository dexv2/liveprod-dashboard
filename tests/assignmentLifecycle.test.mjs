import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Assignment from "../models/assignment.ts";
import {
  AssignmentAuthenticationError,
  getSessionAdminId
} from "../utils/assignmentActor.ts";

const adminId = new mongoose.Types.ObjectId();
const volunteerId = new mongoose.Types.ObjectId();
const scheduleId = new mongoose.Types.ObjectId();

function pendingScheduleAssignment(overrides = {}) {
  const assignment = new Assignment({
    sourceType: "SCHEDULE",
    schedule: scheduleId,
    slotKey: `schedule:${scheduleId}`,
    activeSlotKey: `schedule:${scheduleId}`,
    volunteer: volunteerId,
    role: "FOH",
    status: "PENDING",
    scheduledBy: adminId,
    scheduledAt: new Date(),
    version: 1,
    responseHistory: [{
      action: "ASSIGNED",
      actorType: "ADMIN",
      actorId: adminId,
      channel: "WEB",
      at: new Date()
    }],
    ...overrides
  });
  assignment.$locals.assignmentSource = { _id: assignment.schedule, role: assignment.role };
  return assignment;
}

test("assignment accepts exactly one matching source and stores scheduler/history", async () => {
  const assignment = pendingScheduleAssignment();
  await assignment.validate();
  assert.equal(assignment.status, "PENDING");
  assert.equal(assignment.scheduledBy.toString(), adminId.toString());
  assert.equal(assignment.responseHistory[0].action, "ASSIGNED");
});

test("assignment rejects missing or multiple source references", async () => {
  await assert.rejects(pendingScheduleAssignment({ schedule: undefined }).validate(), /exactly one source/);
  await assert.rejects(
    pendingScheduleAssignment({ event: new mongoose.Types.ObjectId() }).validate(),
    /exactly one source/
  );
});

test("assignment rejects a sourceType that does not match its reference", async () => {
  await assert.rejects(
    pendingScheduleAssignment({ sourceType: "EVENT" }).validate(),
    /must reference an event/
  );
});

test("active lifecycle requires active slot identity and no cancellation metadata", async () => {
  await assert.rejects(pendingScheduleAssignment({ activeSlotKey: undefined }).validate(), /activeSlotKey/);
  await assert.rejects(pendingScheduleAssignment({ cancelledAt: new Date() }).validate(), /cancellation metadata/);
});

test("cancelled lifecycle requires cancellation metadata and releases active slot", async () => {
  await assert.rejects(
    pendingScheduleAssignment({ status: "CANCELLED", activeSlotKey: undefined }).validate(),
    /cancellation metadata/
  );
  const cancelled = pendingScheduleAssignment({
    status: "CANCELLED",
    activeSlotKey: undefined,
    cancelledAt: new Date(),
    cancelledBy: adminId
  });
  await cancelled.validate();
});

test("Assignment declares a unique sparse active-slot index", () => {
  const index = Assignment.schema.indexes().find(([fields]) => fields.activeSlotKey === 1);
  assert.ok(index);
  assert.equal(index[1].unique, true);
  assert.equal(index[1].sparse, true);
});

test("scheduler identity comes only from an authenticated admin session", () => {
  assert.equal(
    getSessionAdminId({ user: { id: adminId.toString(), isAdmin: true } }),
    adminId.toString()
  );
  assert.throws(() => getSessionAdminId(null), AssignmentAuthenticationError);
  assert.throws(
    () => getSessionAdminId({ user: { id: adminId.toString(), isAdmin: false } }),
    AssignmentAuthenticationError
  );
});

test("browser-supplied actor values cannot replace the session actor", () => {
  const browserBody = { scheduledBy: new mongoose.Types.ObjectId().toString(), adminId: "attacker" };
  const trustedActor = getSessionAdminId({ user: { id: adminId.toString(), isAdmin: true } });
  assert.notEqual(trustedActor, browserBody.scheduledBy);
  assert.notEqual(trustedActor, browserBody.adminId);
});
