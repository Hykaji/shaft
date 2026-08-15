import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";
import {
  decideShaftAccess,
  isLocalDevelopmentRequest,
  parseAccessList,
} from "../app/lib/shaft-access-policy.ts";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "cloudflare:workers") {
      return {
        shortCircuit: true,
        url: "data:text/javascript,export const env = {};",
      };
    }
    return nextResolve(specifier, context);
  },
});

const owner = {
  userId: "user-owner",
  email: "Owner@Example.com",
};

test("parses comma-separated allowlists without empty or duplicate entries", () => {
  assert.deepEqual(parseAccessList(" first, second,first, , third "), [
    "first",
    "second",
    "third",
  ]);
  assert.deepEqual(parseAccessList(undefined), []);
});

test("allows only configured owners outside local development", () => {
  assert.equal(
    decideShaftAccess({ user: owner, allowedUserIds: "other,user-owner" }),
    "allowed",
  );
  assert.equal(
    decideShaftAccess({
      user: owner,
      allowedUserEmails: "other@example.com, owner@example.COM",
    }),
    "allowed",
  );
  assert.equal(
    decideShaftAccess({
      user: owner,
      allowedUserIds: "other",
      allowedUserEmails: "other@example.com",
    }),
    "forbidden",
  );
});

test("fails closed for missing identity or owner configuration", () => {
  assert.equal(
    decideShaftAccess({ user: null, allowedUserIds: "user-owner" }),
    "unauthenticated",
  );
  assert.equal(decideShaftAccess({ user: owner }), "not_configured");
  assert.equal(
    decideShaftAccess({
      user: owner,
      allowedUserIds: " , ",
      allowedUserEmails: "",
    }),
    "not_configured",
  );
});

test("limits the local exception to non-production loopback requests", () => {
  for (const url of [
    "http://localhost:3000/api/notion/dashboard",
    "http://127.0.0.1:3000/api/notion/dashboard",
    "http://[::1]:3000/api/notion/dashboard",
  ]) {
    assert.equal(isLocalDevelopmentRequest(url, "development"), true);
  }

  assert.equal(
    isLocalDevelopmentRequest(
      "https://shaft.example/api/notion/dashboard",
      "development",
    ),
    false,
  );
  assert.equal(
    isLocalDevelopmentRequest(
      "http://localhost:3000/api/notion/dashboard",
      "production",
    ),
    false,
  );
  assert.equal(isLocalDevelopmentRequest("not a url", "development"), false);
  assert.equal(
    decideShaftAccess({ user: null, allowLocalDevelopment: true }),
    "allowed",
  );
});

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("auth-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

test("rejects anonymous requests on every Notion route before processing", async () => {
  const worker = await loadWorker();
  const routes = [
    ["/api/notion/dashboard", "GET"],
    ["/api/notion/checkins", "POST"],
    ["/api/notion/finance", "POST"],
    ["/api/notion/training", "POST"],
  ];

  for (const [pathname, method] of routes) {
    const response = await worker.fetch(
      new Request(`https://shaft.example${pathname}`, { method }),
      {
        ASSETS: {
          fetch: async () => new Response("Not found", { status: 404 }),
        },
      },
      {
        waitUntil() {},
        passThroughOnException() {},
      },
    );

    assert.equal(response.status, 401, `${method} ${pathname}`);
    assert.deepEqual(await response.json(), {
      error: "Autenticação necessária.",
    });
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  }
});

test("keeps the Mission 3 guard ahead of D1 and fails closed without its binding", async () => {
  const previousStore = process.env.SHAFT_CHECKIN_STORE;
  const previousIds = process.env.SHAFT_ALLOWED_USER_IDS;
  const previousFetch = globalThis.fetch;
  let remoteFetches = 0;

  try {
    process.env.SHAFT_CHECKIN_STORE = "d1";
    process.env.SHAFT_ALLOWED_USER_IDS = "user-owner";
    globalThis.fetch = async () => {
      remoteFetches += 1;
      throw new Error("Unexpected remote network access");
    };
    const worker = await loadWorker();
    const executionContext = {
      waitUntil() {},
      passThroughOnException() {},
    };
    const assets = {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    };

    const anonymous = await worker.fetch(
      new Request("https://shaft.example/api/notion/checkins", {
        method: "POST",
      }),
      assets,
      executionContext,
    );
    assert.equal(anonymous.status, 401);

    const unavailable = await worker.fetch(
      new Request("https://shaft.example/api/notion/checkins", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "oai-authenticated-user-id": "user-owner",
          "oai-authenticated-user-email": "owner@example.com",
        },
        body: JSON.stringify({ date: "2026-08-15" }),
      }),
      assets,
      executionContext,
    );
    const body = await unavailable.json();
    assert.equal(unavailable.status, 503);
    assert.deepEqual(body, {
      error: "Check-ins e XP estão indisponíveis no momento.",
    });
    assert.equal(Object.hasOwn(body, "xpTotal"), false);
    assert.equal(remoteFetches, 0);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousStore === undefined) delete process.env.SHAFT_CHECKIN_STORE;
    else process.env.SHAFT_CHECKIN_STORE = previousStore;
    if (previousIds === undefined) delete process.env.SHAFT_ALLOWED_USER_IDS;
    else process.env.SHAFT_ALLOWED_USER_IDS = previousIds;
  }
});

test("fails closed for missing owner configuration and rejects non-owners", async () => {
  const previousIds = process.env.SHAFT_ALLOWED_USER_IDS;
  const previousEmails = process.env.SHAFT_ALLOWED_USER_EMAILS;

  try {
    delete process.env.SHAFT_ALLOWED_USER_IDS;
    delete process.env.SHAFT_ALLOWED_USER_EMAILS;

    const unconfiguredWorker = await loadWorker();
    const unconfigured = await unconfiguredWorker.fetch(
      new Request("https://shaft.example/api/notion/dashboard", {
        headers: {
          "oai-authenticated-user-id": "user-owner",
          "oai-authenticated-user-email": "owner@example.com",
        },
      }),
      {
        ASSETS: {
          fetch: async () => new Response("Not found", { status: 404 }),
        },
      },
      {
        waitUntil() {},
        passThroughOnException() {},
      },
    );
    assert.equal(unconfigured.status, 503);
    assert.deepEqual(await unconfigured.json(), {
      error: "Acesso do Shaft ainda não configurado.",
    });

    process.env.SHAFT_ALLOWED_USER_IDS = "user-owner";
    const configuredWorker = await loadWorker();
    const forbidden = await configuredWorker.fetch(
      new Request("https://shaft.example/api/notion/dashboard", {
        headers: {
          "oai-authenticated-user-id": "user-intruder",
          "oai-authenticated-user-email": "intruder@example.com",
        },
      }),
      {
        ASSETS: {
          fetch: async () => new Response("Not found", { status: 404 }),
        },
      },
      {
        waitUntil() {},
        passThroughOnException() {},
      },
    );
    assert.equal(forbidden.status, 403);
    assert.deepEqual(await forbidden.json(), {
      error: "Acesso não autorizado.",
    });
  } finally {
    if (previousIds === undefined) delete process.env.SHAFT_ALLOWED_USER_IDS;
    else process.env.SHAFT_ALLOWED_USER_IDS = previousIds;

    if (previousEmails === undefined) {
      delete process.env.SHAFT_ALLOWED_USER_EMAILS;
    } else {
      process.env.SHAFT_ALLOWED_USER_EMAILS = previousEmails;
    }
  }
});
