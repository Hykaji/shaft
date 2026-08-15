import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";
import {
  calculateCheckinXp,
  canonicalCheckinJson,
  fingerprintCheckinPayload,
  normalizeCheckinPayload,
} from "../app/lib/checkin-payload.ts";
import {
  CheckinConflictError,
  createCheckinService,
} from "../app/lib/checkin-service.ts";
import { startWranglerD1Harness } from "./helpers/wrangler-d1-harness.mjs";

class MemoryLedger {
  rows = new Map();

  async save(record) {
    const key = `${record.ownerKey}\0${record.payload.date}`;
    const current = this.rows.get(key);
    if (!current) {
      const stored = {
        ledgerId: record.ledgerId,
        checkinDate: record.payload.date,
        payloadFingerprint: record.payloadFingerprint,
        mood: record.payload.mood,
        energy: record.payload.energy,
        win: record.payload.win,
        xpDay: record.xpDay,
        ownerKey: record.ownerKey,
      };
      this.rows.set(key, stored);
      return { kind: "created", record: stored, xpTotal: this.total(record.ownerKey) };
    }
    return {
      kind: current.payloadFingerprint === record.payloadFingerprint ? "replayed" : "conflict",
      record: current,
      xpTotal: this.total(record.ownerKey),
    };
  }

  async getDashboard(ownerKey) {
    const rows = [...this.rows.values()]
      .filter((row) => row.ownerKey === ownerKey)
      .sort((left, right) => right.checkinDate.localeCompare(left.checkinDate));
    return { latest: rows[0] ?? null, xpTotal: this.total(ownerKey) };
  }

  total(ownerKey) {
    return [...this.rows.values()]
      .filter((row) => row.ownerKey === ownerKey)
      .reduce((total, row) => total + row.xpDay, 0);
  }
}

const completePayload = {
  dayType: "Trabalho",
  mood: "Ótimo",
  energy: 8,
  sleep: "Completo",
  training: "Completo",
  study: "Completo",
  audiobookMinutes: 15,
  dogMinutes: 20,
  musicMinutes: 30,
  win: "  Entreguei a missão  ",
  difficulty: "Manter o foco",
  nextStep: "Revisar",
};

function payloadFor(date, overrides = {}) {
  return { ...completePayload, date, ...overrides };
}

function assertLoopback(url) {
  const parsed = new URL(url);
  assert.equal(parsed.protocol, "http:");
  assert.equal(parsed.hostname, "127.0.0.1");
}

async function requestJson(baseUrl, pathname, init) {
  const url = `${baseUrl}${pathname}`;
  assertLoopback(url);
  const response = await fetch(url, init);
  return { response, body: await response.json() };
}

async function postJson(baseUrl, pathname, body) {
  return requestJson(baseUrl, pathname, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function seedOwner(baseUrl, ownerKey, state = "ready") {
  const { response } = await postJson(baseUrl, "/raw/seed-owner", { ownerKey, state });
  assert.equal(response.status, 200);
}

test("normalizes a stable canonical payload and preserves the current XP rules", async () => {
  const normalized = normalizeCheckinPayload(
    payloadFor("invalid", {
      energy: 99.8,
      audiobookMinutes: -12,
      dogMinutes: Infinity,
      musicMinutes: 31.9,
      win: "  Vitória limpa  ",
      unknown: "ignored",
    }),
    new Date("2026-08-15T15:00:00.000Z"),
  );

  assert.deepEqual(normalized, {
    payloadVersion: 1,
    date: "2026-08-15",
    dayType: "Trabalho",
    mood: "Ótimo",
    energy: 10,
    sleep: "Completo",
    training: "Completo",
    study: "Completo",
    audiobookMinutes: 0,
    dogMinutes: 0,
    musicMinutes: 31,
    win: "Vitória limpa",
    difficulty: "Manter o foco",
    nextStep: "Revisar",
    summary: "Humor ótimo, energia 10. Vitória: Vitória limpa",
  });
  assert.equal(calculateCheckinXp(normalized), 55);
  assert.equal(Object.hasOwn(JSON.parse(canonicalCheckinJson(normalized)), "unknown"), false);
});

test("produces deterministic fingerprints and distinguishes normalized changes", async () => {
  const first = normalizeCheckinPayload(payloadFor("2026-08-15"));
  const same = normalizeCheckinPayload({
    ...payloadFor("2026-08-15"),
    energy: "8",
    win: "Entreguei a missão",
  });
  const different = normalizeCheckinPayload(payloadFor("2026-08-15", { mood: "Bom" }));

  assert.equal(await fingerprintCheckinPayload(first), await fingerprintCheckinPayload(same));
  assert.notEqual(await fingerprintCheckinPayload(first), await fingerprintCheckinPayload(different));
  assert.match(await fingerprintCheckinPayload(first), /^[0-9a-f]{64}$/);
});

test("service fake replays identical payloads and rejects a different payload", async () => {
  const service = createCheckinService(new MemoryLedger());
  const ownerKey = "local:fake";
  const created = await service.save(ownerKey, payloadFor("2026-08-14"));
  const replayed = await service.save(ownerKey, payloadFor("2026-08-14"));

  assert.equal(created.replayed, false);
  assert.equal(replayed.replayed, true);
  assert.equal(replayed.xpTotal, created.xpTotal);
  assert.equal(replayed.leveledUp, false);
  await assert.rejects(
    service.save(ownerKey, payloadFor("2026-08-14", { mood: "Ruim" })),
    CheckinConflictError,
  );
});

test("D1 route branches contain no Notion check-in read or write", async () => {
  const checkinsRoute = await readFile(
    new URL("../app/api/notion/checkins/route.ts", import.meta.url),
    "utf8",
  );
  const dashboardRoute = await readFile(
    new URL("../app/api/notion/dashboard/route.ts", import.meta.url),
    "utf8",
  );
  const d1Post = checkinsRoute.slice(
    checkinsRoute.indexOf("async function postD1Checkin"),
    checkinsRoute.indexOf("async function postNotionCheckin"),
  );
  const d1Dashboard = dashboardRoute.slice(
    dashboardRoute.indexOf("async function getD1Dashboard"),
    dashboardRoute.indexOf("async function getNotionDashboard"),
  );

  assert.doesNotMatch(d1Post, /SOURCES\.checkins|createPage|query\(/);
  assert.doesNotMatch(d1Dashboard, /SOURCES\.checkins|createPage/);
  assert.match(d1Dashboard, /queryAllPages\(SOURCES\.finances/);
});

let harness;

before(async () => {
  harness = await startWranglerD1Harness();
});

after(async () => {
  if (harness) await harness.stop();
});

for (const concurrency of [2, 10, 100]) {
  test(`D1 local grants XP once under ${concurrency} concurrent identical requests`, async () => {
    const ownerKey = `local:concurrency-${concurrency}`;
    const date = `2026-08-${String(concurrency === 100 ? 13 : concurrency).padStart(2, "0")}`;
    await seedOwner(harness.baseUrl, ownerKey);

    const responses = await Promise.all(Array.from({ length: concurrency }, () =>
      postJson(harness.baseUrl, "/save", {
        ownerKey,
        payload: payloadFor(date),
      })));

    assert.equal(responses.every(({ response }) => response.status === 200), true);
    assert.equal(responses.filter(({ body }) => body.replayed === false).length, 1);
    assert.equal(responses.filter(({ body }) => body.replayed === true).length, concurrency - 1);
    assert.deepEqual(new Set(responses.map(({ body }) => body.xpTotal)), new Set([65]));

    const count = await requestJson(
      harness.baseUrl,
      `/raw/count?ownerKey=${encodeURIComponent(ownerKey)}&date=${date}`,
    );
    assert.deepEqual(count.body, { count: 1 });
  });
}

test("D1 local returns an explicit conflict and preserves the original row", async () => {
  const ownerKey = "local:conflict";
  const date = "2026-08-11";
  await seedOwner(harness.baseUrl, ownerKey);
  const original = await postJson(harness.baseUrl, "/save", {
    ownerKey,
    payload: payloadFor(date),
  });
  const conflict = await postJson(harness.baseUrl, "/save", {
    ownerKey,
    payload: payloadFor(date, { mood: "Ruim", win: "Outra versão" }),
  });
  const stored = await requestJson(
    harness.baseUrl,
    `/raw/row?ownerKey=${encodeURIComponent(ownerKey)}&date=${date}`,
  );

  assert.equal(original.response.status, 200);
  assert.equal(conflict.response.status, 409);
  assert.deepEqual(conflict.body, { error: "Já existe um check-in diferente para esta data." });
  assert.equal(stored.body.row.payload_fingerprint.length, 64);
  assert.equal(JSON.parse(stored.body.row.payload_json).mood, "Ótimo");
  assert.equal(stored.body.row.xp_day, 65);
});

test("different dates and owners remain isolated without lost XP updates", async () => {
  const ownerKey = "local:parallel-dates";
  const otherOwner = "local:parallel-other";
  await seedOwner(harness.baseUrl, ownerKey);
  await seedOwner(harness.baseUrl, otherOwner);
  const dates = Array.from({ length: 10 }, (_, index) => `2026-07-${String(index + 1).padStart(2, "0")}`);

  const responses = await Promise.all(dates.map((date) => postJson(harness.baseUrl, "/save", {
    ownerKey,
    payload: payloadFor(date),
  })));
  const other = await postJson(harness.baseUrl, "/save", {
    ownerKey: otherOwner,
    payload: payloadFor(dates.at(-1)),
  });
  const dashboard = await requestJson(
    harness.baseUrl,
    `/dashboard?ownerKey=${encodeURIComponent(ownerKey)}`,
  );
  const otherDashboard = await requestJson(
    harness.baseUrl,
    `/dashboard?ownerKey=${encodeURIComponent(otherOwner)}`,
  );

  assert.equal(responses.every(({ response }) => response.status === 200), true);
  assert.equal(dashboard.body.xpTotal, 650);
  assert.equal(dashboard.body.latest.checkinDate, dates.at(-1));
  assert.equal(other.response.status, 200);
  assert.equal(otherDashboard.body.xpTotal, 65);
});

test("a retroactive check-in changes SUM(xp_day) without changing the latest logical date", async () => {
  const ownerKey = "local:retroactive";
  await seedOwner(harness.baseUrl, ownerKey);
  await postJson(harness.baseUrl, "/save", {
    ownerKey,
    payload: payloadFor("2026-08-15"),
  });
  await postJson(harness.baseUrl, "/save", {
    ownerKey,
    payload: payloadFor("2026-01-02", { sleep: "Mínimo" }),
  });
  const dashboard = await requestJson(
    harness.baseUrl,
    `/dashboard?ownerKey=${encodeURIComponent(ownerKey)}`,
  );

  assert.equal(dashboard.body.xpTotal, 125);
  assert.equal(dashboard.body.latest.checkinDate, "2026-08-15");
});

test("real D1 rejects a physical duplicate and rolls back a failed batch", async () => {
  const ownerKey = "local:physical";
  const date = "2026-08-10";
  await seedOwner(harness.baseUrl, ownerKey);
  await postJson(harness.baseUrl, "/save", {
    ownerKey,
    payload: payloadFor(date),
  });
  const duplicate = await postJson(harness.baseUrl, "/raw/direct-duplicate", {
    ownerKey,
    date,
  });
  const rollback = await postJson(harness.baseUrl, "/raw/rollback", {});

  assert.deepEqual(duplicate.body, { rejected: true });
  assert.deepEqual(rollback.body, { rejected: true, count: 0 });
});

test("owner not ready fails closed and the ledger stays empty", async () => {
  const ownerKey = "local:not-ready";
  await seedOwner(harness.baseUrl, ownerKey, "awaiting_audit");
  const save = await postJson(harness.baseUrl, "/save", {
    ownerKey,
    payload: payloadFor("2026-08-09"),
  });
  const count = await requestJson(
    harness.baseUrl,
    `/raw/count?ownerKey=${encodeURIComponent(ownerKey)}`,
  );

  assert.equal(save.response.status, 503);
  assert.equal(Object.hasOwn(save.body, "xpTotal"), false);
  assert.deepEqual(count.body, { count: 0 });
});

test("schema absent fails closed without exposing a false XP total", async () => {
  const emptyHarness = await startWranglerD1Harness({ applyMigration: false });
  try {
    const save = await postJson(emptyHarness.baseUrl, "/save", {
      ownerKey: "local:no-schema",
      payload: payloadFor("2026-08-08"),
    });
    assert.equal(save.response.status, 503);
    assert.equal(Object.hasOwn(save.body, "xpTotal"), false);
  } finally {
    await emptyHarness.stop();
  }
});

test("local D1 uses the owner/date index for SUM and accepts PRAGMA optimize", async () => {
  const result = await requestJson(harness.baseUrl, "/raw/query-plan");
  assert.equal(result.response.status, 200);
  assert.equal(
    result.body.plan.some((row) => String(row.detail).includes("uq_checkin_ledger_owner_date")),
    true,
  );
});
