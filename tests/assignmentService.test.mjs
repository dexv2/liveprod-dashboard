import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import {
  assignmentServiceDependencies,
  assignScheduleVolunteer,
  deassignScheduleVolunteer,
  deleteSchedules,
  deleteEvent,
  reconcileEventAssignments,
  transitionAssignment,
  validateEventAssignments
} from "../services/assignments/assignmentService.ts";

const id = () => new mongoose.Types.ObjectId();
const actorId = id().toString();

function makeHarness() {
  const state = {
    schedules: new Map(), volunteers: new Map(), events: new Map(), assignments: [], sheets: [], notifications: [],
    failVolunteerUpdateMany: 0, failVolunteerUpdateOne: 0
  };
  const cloneEvent = event => event && ({
    ...event,
    toObject() { return { ...this, assignedVolunteers: { ...(this.assignedVolunteers || {}) } }; }
  });
  const matches = (doc, filter) => Object.entries(filter).every(([key, expected]) => {
    const actual = doc[key];
    if (expected && typeof expected === "object" && !(expected instanceof mongoose.Types.ObjectId)) {
      if ("$in" in expected) return expected.$in.includes(actual);
      if ("$ne" in expected) return actual?.toString() !== expected.$ne?.toString();
      if ("$exists" in expected) return expected.$exists ? actual !== undefined : actual === undefined;
    }
    return actual?.toString() === expected?.toString();
  });
  const applyUpdate = (doc, update) => {
    Object.assign(doc, update.$set || {});
    for (const key of Object.keys(update.$unset || {})) delete doc[key];
    for (const [key, amount] of Object.entries(update.$inc || {})) doc[key] = (doc[key] || 0) + amount;
    for (const [key, value] of Object.entries(update.$push || {})) (doc[key] ||= []).push(value);
  };

  const deps = {
    Schedule: {
      async findById(value) { return state.schedules.get(value.toString()) || null; },
      async findOneAndUpdate(filter, update) {
        const doc = state.schedules.get(filter._id.toString());
        if (!doc) return null;
        applyUpdate(doc, update);
        return doc;
      },
      async updateOne(filter, update) {
        const doc = state.schedules.get(filter._id.toString());
        if (!doc) return { modifiedCount: 0 };
        applyUpdate(doc, update);
        return { modifiedCount: 1 };
      },
      async find(filter) { return [...state.schedules.values()].filter(doc => matches(doc, filter)); },
      async deleteOne(filter) {
        const doc = state.schedules.get(filter._id.toString());
        if (!doc || !matches(doc, filter)) return { deletedCount: 0 };
        state.schedules.delete(filter._id.toString());
        return { deletedCount: 1 };
      }
    },
    Volunteer: {
      async exists(filter) { return state.volunteers.has(filter._id.toString()) ? { _id: filter._id } : null; },
      async findById(value) { return state.volunteers.get(value.toString()) || null; },
      async updateMany(filter, update) {
        if (state.failVolunteerUpdateMany-- > 0) throw new Error("injected reverse-reference failure");
        let modifiedCount = 0;
        for (const volunteer of state.volunteers.values()) {
          const contains = volunteer.schedules.some(value => value.toString() === filter.schedules.toString());
          const excluded = filter._id?.$ne && volunteer._id.toString() === filter._id.$ne.toString();
          if (contains && !excluded) {
            volunteer.schedules = volunteer.schedules.filter(value => value.toString() !== filter.schedules.toString());
            modifiedCount += 1;
          }
        }
        return { modifiedCount };
      },
      async updateOne(filter, update) {
        if (state.failVolunteerUpdateOne-- > 0) throw new Error("injected volunteer update failure");
        const volunteer = state.volunteers.get(filter._id.toString());
        if (!volunteer) return { modifiedCount: 0 };
        if (update.$addToSet && !volunteer.schedules.some(value => value.toString() === update.$addToSet.schedules.toString())) {
          volunteer.schedules.push(update.$addToSet.schedules);
        }
        return { modifiedCount: 1 };
      }
    },
    Assignment: {
      async findOne(filter) { return state.assignments.find(doc => matches(doc, filter)) || null; },
      async findOneAndUpdate(filter, update) {
        const doc = state.assignments.find(item => matches(item, filter));
        if (!doc) return null;
        applyUpdate(doc, update);
        return doc;
      }
    },
    Event: {
      async findById(value) { return cloneEvent(state.events.get(value.toString()) || null); },
      async deleteOne(filter) {
        const deleted = state.events.delete(filter._id.toString());
        return { deletedCount: deleted ? 1 : 0 };
      }
    },
    async createAssignmentDocument(payload) {
      if (payload.activeSlotKey && state.assignments.some(item => item.activeSlotKey === payload.activeSlotKey)) {
        const error = new Error("duplicate slot");
        error.code = 11000;
        throw error;
      }
      const doc = { _id: id(), ...payload };
      state.assignments.push(doc);
      return doc;
    },
    async recordVolunteerToSheet(...args) { state.sheets.push(args); },
    async recordVolunteerToSheetSNS(...args) { state.sheets.push(args); },
    async notifyAssignmentSafely(assignmentId) {
      state.notifications.push(assignmentId);
      return { status: "SENT" };
    }
  };
  Object.assign(assignmentServiceDependencies, deps);

  const addVolunteer = name => {
    const volunteer = { _id: id(), name, schedules: [] };
    state.volunteers.set(volunteer._id.toString(), volunteer);
    return volunteer;
  };
  const addSchedule = volunteer => {
    const schedule = {
      _id: id(), date: new Date("2026-09-06"), service: "s1", role: "FOH",
      ...(volunteer ? { volunteer: volunteer._id } : {})
    };
    state.schedules.set(schedule._id.toString(), schedule);
    if (volunteer) volunteer.schedules.push(schedule._id);
    return schedule;
  };
  const addEvent = assignedVolunteers => {
    const event = { _id: id(), status: "confirmed", assignedVolunteers: { ...assignedVolunteers } };
    state.events.set(event._id.toString(), event);
    return event;
  };
  const activeFor = slot => state.assignments.filter(item => item.activeSlotKey === slot);
  return { state, addVolunteer, addSchedule, addEvent, activeFor };
}

test("service assigns an empty Schedule and is idempotent", async () => {
  const h = makeHarness();
  const a = h.addVolunteer("A");
  const schedule = h.addSchedule();
  await assignScheduleVolunteer({ scheduleId: schedule._id.toString(), volunteerId: a._id.toString(), scheduledBy: actorId });
  await assignScheduleVolunteer({ scheduleId: schedule._id.toString(), volunteerId: a._id.toString(), scheduledBy: actorId });
  assert.equal(schedule.volunteer.toString(), a._id.toString());
  assert.deepEqual(a.schedules.map(String), [schedule._id.toString()]);
  assert.equal(h.activeFor(`schedule:${schedule._id}`).length, 1);
  assert.equal(h.state.notifications.length, 1);
});

test("service reassigns A to B and preserves cancelled history", async () => {
  const h = makeHarness();
  const a = h.addVolunteer("A");
  const b = h.addVolunteer("B");
  const schedule = h.addSchedule(a);
  await assignScheduleVolunteer({ scheduleId: schedule._id.toString(), volunteerId: a._id.toString(), scheduledBy: actorId });
  await assignScheduleVolunteer({ scheduleId: schedule._id.toString(), volunteerId: b._id.toString(), scheduledBy: actorId });
  assert.deepEqual(a.schedules, []);
  assert.deepEqual(b.schedules.map(String), [schedule._id.toString()]);
  assert.equal(h.activeFor(`schedule:${schedule._id}`)[0].volunteer.toString(), b._id.toString());
  assert.equal(h.state.assignments.filter(item => item.status === "CANCELLED").length, 1);
  assert.equal(h.state.notifications.length, 2);
});

test("service deassigns A and cancels lifecycle", async () => {
  const h = makeHarness();
  const a = h.addVolunteer("A");
  const schedule = h.addSchedule(a);
  await assignScheduleVolunteer({ scheduleId: schedule._id.toString(), volunteerId: a._id.toString(), scheduledBy: actorId });
  await deassignScheduleVolunteer({ scheduleId: schedule._id.toString(), cancelledBy: actorId });
  assert.equal(schedule.volunteer, undefined);
  assert.deepEqual(a.schedules, []);
  assert.equal(h.activeFor(`schedule:${schedule._id}`).length, 0);
});

test("retry repairs failure after Schedule save before reverse-reference work", async () => {
  const h = makeHarness();
  const a = h.addVolunteer("A");
  const b = h.addVolunteer("B");
  const schedule = h.addSchedule(a);
  h.state.failVolunteerUpdateMany = 1;
  await assert.rejects(assignScheduleVolunteer({ scheduleId: schedule._id.toString(), volunteerId: b._id.toString(), scheduledBy: actorId }));
  await assignScheduleVolunteer({ scheduleId: schedule._id.toString(), volunteerId: b._id.toString(), scheduledBy: actorId });
  assert.deepEqual(a.schedules, []);
  assert.deepEqual(b.schedules.map(String), [schedule._id.toString()]);
});

test("retry repairs failure adding the authoritative Volunteer reference", async () => {
  const h = makeHarness();
  const a = h.addVolunteer("A");
  const b = h.addVolunteer("B");
  const schedule = h.addSchedule(a);
  h.state.failVolunteerUpdateOne = 1;
  await assert.rejects(assignScheduleVolunteer({ scheduleId: schedule._id.toString(), volunteerId: b._id.toString(), scheduledBy: actorId }));
  await assignScheduleVolunteer({ scheduleId: schedule._id.toString(), volunteerId: b._id.toString(), scheduledBy: actorId });
  assert.deepEqual(a.schedules, []);
  assert.deepEqual(b.schedules.map(String), [schedule._id.toString()]);
});

test("competing Schedule assignments converge to one authoritative winner", async () => {
  const h = makeHarness();
  const a = h.addVolunteer("A");
  const b = h.addVolunteer("B");
  const schedule = h.addSchedule();
  await Promise.all([
    assignScheduleVolunteer({ scheduleId: schedule._id.toString(), volunteerId: a._id.toString(), scheduledBy: actorId }),
    assignScheduleVolunteer({ scheduleId: schedule._id.toString(), volunteerId: b._id.toString(), scheduledBy: actorId })
  ]);
  const winner = schedule.volunteer.toString();
  assert.equal(h.activeFor(`schedule:${schedule._id}`).length, 1);
  assert.equal(h.activeFor(`schedule:${schedule._id}`)[0].volunteer.toString(), winner);
  for (const volunteer of [a, b]) assert.equal(volunteer.schedules.length, volunteer._id.toString() === winner ? 1 : 0);
});

test("Schedule bulk deletion removes reverse references and cancels lifecycle", async () => {
  const h = makeHarness();
  const a = h.addVolunteer("A");
  const schedule = h.addSchedule(a);
  schedule.service = "sns2";
  await assignScheduleVolunteer({ scheduleId: schedule._id.toString(), volunteerId: a._id.toString(), scheduledBy: actorId });
  const result = await deleteSchedules({ service: "sns2" }, actorId);
  assert.equal(result.deletedCount, 1);
  assert.deepEqual(a.schedules, []);
  assert.equal(h.state.schedules.has(schedule._id.toString()), false);
  assert.equal(h.activeFor(`schedule:${schedule._id}`).length, 0);
});

test("Event role transitions A to B to N/A to TBC", async () => {
  const h = makeHarness();
  const a = h.addVolunteer("A");
  const b = h.addVolunteer("B");
  const event = h.addEvent({ foh: a._id.toString() });
  await reconcileEventAssignments(event._id.toString(), actorId);
  await reconcileEventAssignments(event._id.toString(), actorId);
  assert.equal(h.state.notifications.length, 1);
  event.assignedVolunteers.foh = b._id.toString();
  await reconcileEventAssignments(event._id.toString(), actorId);
  assert.equal(h.state.notifications.length, 2);
  assert.equal(h.activeFor(`event:${event._id}:foh`)[0].volunteer.toString(), b._id.toString());
  event.assignedVolunteers.foh = "N/A";
  await reconcileEventAssignments(event._id.toString(), actorId);
  assert.equal(h.activeFor(`event:${event._id}:foh`).length, 0);
  event.assignedVolunteers.foh = "TBC";
  await reconcileEventAssignments(event._id.toString(), actorId);
  assert.equal(h.activeFor(`event:${event._id}:foh`).length, 0);
});

test("Event validation rejects malformed and nonexistent volunteers before mutation", async () => {
  const h = makeHarness();
  await assert.rejects(validateEventAssignments({ foh: "bad" }), error => error.status === 400);
  await assert.rejects(validateEventAssignments({ foh: id().toString() }), error => error.status === 404);
  assert.equal(h.state.events.size, 0);
  assert.equal(h.state.assignments.length, 0);
});

test("Event validation accepts supported sentinels and existing Volunteer IDs", async () => {
  const h = makeHarness();
  const a = h.addVolunteer("A");
  assert.deepEqual(await validateEventAssignments({
    foh: a._id.toString(), bcMix: "N/A", rfTech: "TBC", assistantFoh: ""
  }), { foh: a._id.toString(), bcMix: "N/A", rfTech: "TBC" });
});

test("competing Event reconciliations agree with stored Event", async () => {
  const h = makeHarness();
  const a = h.addVolunteer("A");
  const b = h.addVolunteer("B");
  const event = h.addEvent({ foh: a._id.toString() });
  const first = reconcileEventAssignments(event._id.toString(), actorId);
  event.assignedVolunteers.foh = b._id.toString();
  await Promise.all([first, reconcileEventAssignments(event._id.toString(), actorId)]);
  assert.equal(h.activeFor(`event:${event._id}:foh`).length, 1);
  assert.equal(h.activeFor(`event:${event._id}:foh`)[0].volunteer.toString(), event.assignedVolunteers.foh);
});

test("cancelled Event cancels every active role", async () => {
  const h = makeHarness();
  const a = h.addVolunteer("A");
  const event = h.addEvent({ foh: a._id.toString(), bcMix: a._id.toString() });
  await reconcileEventAssignments(event._id.toString(), actorId);
  event.status = "cancelled";
  await reconcileEventAssignments(event._id.toString(), actorId);
  assert.equal(h.state.assignments.filter(item => item.activeSlotKey).length, 0);
  assert.equal(h.state.assignments.filter(item => item.status === "CANCELLED").length, 2);
});

test("Event deletion preserves Calendar cleanup ID and cancelled history", async () => {
  const h = makeHarness();
  const a = h.addVolunteer("A");
  const event = h.addEvent({ foh: a._id.toString() });
  event.eventName = "Special Event";
  event.googleCalendarEventId = "calendar-123";
  await reconcileEventAssignments(event._id.toString(), actorId);
  const cleanup = await deleteEvent(event._id.toString(), actorId);
  assert.deepEqual(cleanup, { eventName: "Special Event", googleCalendarEventId: "calendar-123" });
  assert.equal(h.state.events.has(event._id.toString()), false);
  assert.equal(h.activeFor(`event:${event._id}:foh`).length, 0);
  assert.equal(h.state.assignments[0].status, "CANCELLED");
});

test("active slot creation rejects a duplicate", async () => {
  const h = makeHarness();
  const slot = `schedule:${id()}`;
  await h.state.assignments.push({ _id: id(), activeSlotKey: slot });
  await assert.rejects(
    assignmentServiceDependencies.createAssignmentDocument({ activeSlotKey: slot }, {}),
    error => error.code === 11000
  );
});

test("conditional version transition rejects a stale version", async () => {
  const h = makeHarness();
  const assignment = { _id: id(), status: "PENDING", version: 1, responseHistory: [] };
  h.state.assignments.push(assignment);
  const updated = await transitionAssignment({
    assignmentId: assignment._id.toString(), expectedVersion: 1, expectedStatus: "PENDING",
    nextStatus: "CONFIRMED", actorType: "ADMIN", actorId, channel: "ADMIN"
  });
  assert.equal(updated.version, 2);
  assert.equal(await transitionAssignment({
    assignmentId: assignment._id.toString(), expectedVersion: 1, expectedStatus: "PENDING",
    nextStatus: "DECLINED", actorType: "ADMIN", actorId, channel: "ADMIN"
  }), null);
});

test("touched mutation routes require server auth and ignore browser actor fields", () => {
  const paths = [
    "app/api/schedule/assign/route.ts",
    "app/api/schedule/de-assign/route.ts",
    "app/api/events/route.ts",
    "app/api/events/id/[id]/route.ts"
  ];
  for (const path of paths) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /requireAssignmentAdmin\(await auth\(\)\)/);
  }
  for (const path of paths.slice(2)) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /delete (eventData|updateData)\.scheduledBy/);
    assert.match(source, /delete (eventData|updateData)\.adminId/);
  }
});

test("Event delete route attempts Calendar cleanup using captured ID", () => {
  const source = readFileSync("app/api/events/id/[id]/route.ts", "utf8");
  assert.match(source, /deleteEvent\(params\.id, cancelledBy\)/);
  assert.match(source, /deleteGCalEvent\(calendarEventId\)/);
  assert.match(source, /calendarCleanupPending/);
});
