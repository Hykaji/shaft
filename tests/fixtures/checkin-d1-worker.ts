import {
  CheckinConflictError,
  CheckinStoreUnavailableError,
  createCheckinService,
} from "../../app/lib/checkin-service";
import { createD1CheckinLedger } from "../../db/checkins";

type Env = {
  DB: D1Database;
};

function json(value: unknown, status = 200) {
  return Response.json(value, { status });
}

async function readBody(request: Request) {
  return await request.json() as Record<string, unknown>;
}

async function handleSave(request: Request, env: Env) {
  const body = await readBody(request);
  const ownerKey = String(body.ownerKey ?? "");
  const payload = body.payload as Record<string, unknown>;
  const now = typeof body.now === "string" ? new Date(body.now) : new Date();

  try {
    const service = createCheckinService(createD1CheckinLedger(env.DB));
    return json(await service.save(ownerKey, payload, now));
  } catch (error) {
    if (error instanceof CheckinConflictError) {
      return json({ error: error.message }, 409);
    }
    if (error instanceof CheckinStoreUnavailableError) {
      return json({ error: "Check-ins e XP estão indisponíveis no momento." }, 503);
    }
    return json({ error: "Falha inesperada no fixture local." }, 500);
  }
}

async function handleDashboard(url: URL, env: Env) {
  try {
    const ownerKey = url.searchParams.get("ownerKey") ?? "";
    const service = createCheckinService(createD1CheckinLedger(env.DB));
    return json(await service.getDashboard(ownerKey));
  } catch (error) {
    if (error instanceof CheckinStoreUnavailableError) {
      return json({ error: "Check-ins e XP estão indisponíveis no momento." }, 503);
    }
    return json({ error: "Falha inesperada no fixture local." }, 500);
  }
}

async function seedOwner(request: Request, env: Env) {
  const body = await readBody(request);
  const ownerKey = String(body.ownerKey ?? "");
  const state = String(body.state ?? "ready");
  const ready = state === "ready";
  const fingerprint = "a".repeat(64);

  await env.DB.prepare(`
    INSERT INTO checkin_owners (
      owner_key,
      ledger_state,
      legacy_audit_fingerprint,
      legacy_observed_count,
      legacy_imported_count,
      audit_completed_at,
      activated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    ownerKey,
    state,
    ready ? fingerprint : null,
    ready ? 0 : null,
    ready ? 0 : null,
    ready ? "2026-08-15T12:00:00.000Z" : null,
    ready ? "2026-08-15T12:00:00.000Z" : null,
  ).run();

  return json({ seeded: true });
}

async function countRows(url: URL, env: Env) {
  const ownerKey = url.searchParams.get("ownerKey") ?? "";
  const date = url.searchParams.get("date");
  const statement = date
    ? env.DB.prepare(
      "SELECT COUNT(*) AS count FROM checkin_ledger WHERE owner_key = ? AND checkin_date = ?",
    ).bind(ownerKey, date)
    : env.DB.prepare(
      "SELECT COUNT(*) AS count FROM checkin_ledger WHERE owner_key = ?",
    ).bind(ownerKey);
  const row = await statement.first<{ count: number }>();
  return json({ count: Number(row?.count ?? 0) });
}

async function getStoredRow(url: URL, env: Env) {
  const ownerKey = url.searchParams.get("ownerKey") ?? "";
  const date = url.searchParams.get("date") ?? "";
  const row = await env.DB.prepare(`
    SELECT checkin_date, payload_fingerprint, payload_json, xp_day
    FROM checkin_ledger
    WHERE owner_key = ? AND checkin_date = ?
  `).bind(ownerKey, date).first();
  return json({ row });
}

async function directDuplicate(request: Request, env: Env) {
  const body = await readBody(request);
  const ownerKey = String(body.ownerKey ?? "");
  const date = String(body.date ?? "");

  try {
    await env.DB.prepare(`
      INSERT INTO checkin_ledger
      SELECT
        ?, owner_key, checkin_date, payload_version, payload_fingerprint,
        payload_json, day_type, mood, energy, sleep_status, training_status,
        study_status, audiobook_minutes, dog_minutes, music_minutes, win,
        difficulty, next_step, summary, xp_day, origin,
        legacy_notion_page_id, import_batch_id, created_at
      FROM checkin_ledger
      WHERE owner_key = ? AND checkin_date = ?
    `).bind(crypto.randomUUID(), ownerKey, date).run();
    return json({ rejected: false });
  } catch {
    return json({ rejected: true });
  }
}

async function verifyRollback(env: Env) {
  const ownerKey = `rollback:${crypto.randomUUID()}`;
  let rejected = false;
  try {
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO checkin_owners (owner_key, ledger_state) VALUES (?, 'awaiting_audit')",
      ).bind(ownerKey),
      env.DB.prepare(
        "INSERT INTO checkin_owners (owner_key, ledger_state) VALUES (?, 'awaiting_audit')",
      ).bind(ownerKey),
    ]);
  } catch {
    rejected = true;
  }

  const row = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM checkin_owners WHERE owner_key = ?",
  ).bind(ownerKey).first<{ count: number }>();
  return json({ rejected, count: Number(row?.count ?? 0) });
}

async function queryPlan(env: Env) {
  const plan = await env.DB.prepare(`
    EXPLAIN QUERY PLAN
    SELECT COALESCE(SUM(xp_day), 0)
    FROM checkin_ledger
    WHERE owner_key = ?
  `).bind("local:query-plan").all();
  await env.DB.prepare("PRAGMA optimize").run();
  return json({ plan: plan.results });
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true });
    }
    if (request.method === "POST" && url.pathname === "/save") {
      return handleSave(request, env);
    }
    if (request.method === "GET" && url.pathname === "/dashboard") {
      return handleDashboard(url, env);
    }
    if (request.method === "POST" && url.pathname === "/raw/seed-owner") {
      return seedOwner(request, env);
    }
    if (request.method === "GET" && url.pathname === "/raw/count") {
      return countRows(url, env);
    }
    if (request.method === "GET" && url.pathname === "/raw/row") {
      return getStoredRow(url, env);
    }
    if (request.method === "POST" && url.pathname === "/raw/direct-duplicate") {
      return directDuplicate(request, env);
    }
    if (request.method === "POST" && url.pathname === "/raw/rollback") {
      return verifyRollback(env);
    }
    if (request.method === "GET" && url.pathname === "/raw/query-plan") {
      return queryPlan(env);
    }
    return json({ error: "Not found" }, 404);
  },
};
