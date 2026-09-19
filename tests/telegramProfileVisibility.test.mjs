import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { UPDATE_VOLUNTEER_PROFILE, category } from "../utils/constants.ts";

const require = createRequire(import.meta.url);
// Compile the actual profile so these tests exercise its rendered authorization gate.
const { outputText } = ts.transpileModule(
  readFileSync(new URL("../components/client/CCVolunteerProfile.tsx", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }
);

function renderProfile(session) {
  const exports = {};
  const emptyComponent = () => null;
  const mocks = {
    "next-auth/react": { useSession: () => ({ data: session }) },
    "next/navigation": { useRouter: () => ({}), redirect: () => { throw new Error("Unexpected redirect"); } },
    "@/context/DeviceProvider": { useDevice: () => ({ isMobile: false }) },
    "@/utils/apis/put": {},
    "@/utils/constants": { UPDATE_VOLUNTEER_PROFILE, category, serviceTime: {} },
    "@/utils/dates": { diff: () => 0 },
    "@/utils/helpers": { newDate: () => new Date("2026-09-06T00:00:00Z") },
    "@/components/client/CCTelegramLink": {
      default: () => React.createElement("section", { "data-testid": "telegram-controls" })
    }
  };
  runInNewContext(outputText, {
    exports,
    require: (specifier) => {
      if (specifier in mocks) return mocks[specifier];
      if (specifier.startsWith("@/components/")) return { default: emptyComponent };
      if (specifier.startsWith("react-icons/")) return new Proxy({}, { get: () => emptyComponent });
      return require(specifier);
    }
  });
  return renderToStaticMarkup(React.createElement(exports.default, {
    volunteer: {
      _id: "volunteer-test", firstName: "Test", lastName: "Volunteer",
      status: "active", segment: "", roles: [], gender: "", schedules: []
    }
  }));
}

for (const [name, session, visible] of [
  ["SuperAdmin without explicit permission", { user: { isAdmin: true, superAdmin: true, permissions: [] } }, true],
  ["ordinary Admin with permission", { user: { isAdmin: true, superAdmin: false, permissions: [UPDATE_VOLUNTEER_PROFILE] } }, true],
  ["ordinary Admin without permission", { user: { isAdmin: true, superAdmin: false, permissions: [] } }, false],
  ["unauthenticated user", null, false],
  ["Volunteer-only visitor", { user: { isAdmin: false, permissions: [] } }, false],
  ["non-Admin with SuperAdmin flag and permission", { user: { isAdmin: false, superAdmin: true, permissions: [UPDATE_VOLUNTEER_PROFILE] } }, false]
]) {
  test(`Telegram controls visibility: ${name}`, () => {
    const html = renderProfile(session);
    assert.ok(html.includes("Basic Info"), "Volunteer profile renders successfully");
    assert.equal(html.includes('data-testid="telegram-controls"'), visible);
  });
}
