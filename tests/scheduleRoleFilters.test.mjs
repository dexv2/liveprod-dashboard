import test from "node:test";
import assert from "node:assert/strict";
import { category, roleFilter } from "../utils/constants.ts";

function rolesFor(value) {
  const filter = roleFilter.find(filter => filter.value === value);
  assert.ok(filter, `Missing role filter: ${value}`);
  return filter.roles;
}

// Preserve the existing generation/export contract, including positional order.
const existingSundayRoles = [
  "foh",
  "foh assistant",
  "foh trainee",
  "foh assistant trainee",
  "foh observer",
  "monitor mix",
  "rf tech",
  "monitor mix trainee",
  "monitor mix observer",
  "broadcast mix",
  "broadcast mix assistant",
  "broadcast mix trainee",
  "broadcast mix assistant trainee",
  "broadcast mix observer",
  "nxtgen",
  "nxtgen trainee",
  "nxtgen observer",
  "audio volunteer 1",
  "audio volunteer 2"
];

const existingSaturdaySheetRoles = existingSundayRoles.filter(role => !role.startsWith("nxtgen"));
const existingSaturdayRoles = existingSaturdaySheetRoles.filter(role => role !== "rf tech");

test("Assistant displays exactly four canonical roles in the required order", () => {
  assert.deepEqual(rolesFor("assistant"), [
    "foh assistant",
    "broadcast mix assistant",
    "foh assistant trainee",
    "broadcast mix assistant trainee"
  ]);
});

test("Assistant roles are unique", () => {
  const roles = rolesFor("assistant");
  assert.equal(new Set(roles).size, roles.length);
});

test("every Assistant role is accepted by the canonical role list", () => {
  for (const role of rolesFor("assistant")) {
    assert.ok(category.ROLES.includes(role), `Unknown Assistant role: ${role}`);
  }
});

test("FOH Assistant Trainee remains in its existing category, generation, and export lists", () => {
  for (const roles of [rolesFor("foh"), rolesFor("all"), category.ROLES, category.SNS_ROLES, category.SNS_GSHEET_ROLES]) {
    assert.ok(roles.includes("foh assistant trainee"));
  }
});

test("Broadcast Mix Assistant Trainee remains in its existing category, generation, and export lists", () => {
  for (const roles of [rolesFor("bc-mix"), rolesFor("trainee"), rolesFor("all"), category.ROLES, category.SNS_ROLES, category.SNS_GSHEET_ROLES]) {
    assert.ok(roles.includes("broadcast mix assistant trainee"));
  }
});

test("Sunday generation role membership and order remain unchanged", () => {
  assert.deepEqual(category.ROLES, existingSundayRoles);
});

test("Saturday generation role membership and order remain unchanged", () => {
  assert.deepEqual(category.SNS_ROLES, existingSaturdayRoles);
});

test("Saturday Google Sheets role membership and order remain unchanged", () => {
  assert.deepEqual(category.SNS_GSHEET_ROLES, existingSaturdaySheetRoles);
});

test("Trainee category remains unchanged, including its existing FOH omissions", () => {
  assert.deepEqual(rolesFor("trainee"), [
    "monitor mix trainee",
    "broadcast mix trainee",
    "broadcast mix assistant trainee",
    "nxtgen trainee"
  ]);
});
