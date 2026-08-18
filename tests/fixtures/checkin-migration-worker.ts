import {
  CheckinMigrationError,
  importCheckinMigration,
  reconcileCheckinMigration,
} from "../../db/checkin-migration";
import type { CheckinMigrationManifest } from "../../db/checkin-migration";
import type { CheckinMigrationD1Database } from "../../db/checkin-migration";
import { MigrationArtifactError } from "../../scripts/checkin-migration/lib/canonical.mjs";
import { verifySnapshotAndManifest } from "../../scripts/checkin-migration/lib/manifest.mjs";

type Env = { DB: CheckinMigrationD1Database };

function json(value: unknown, status = 200) {
  return Response.json(value, { status });
}

async function body(request: Request) {
  return await request.json() as Record<string, unknown>;
}

function migrationFailure(error: unknown) {
  if (error instanceof CheckinMigrationError || error instanceof MigrationArtifactError) {
    return json({ error: error.message, code: error.code }, 409);
  }
  return json({ error: "Falha inesperada no fixture local.", code: "UNEXPECTED_FAILURE" }, 500);
}

async function handleImport(request: Request, env: Env) {
  try {
    const value = await body(request);
    const verified = await verifySnapshotAndManifest(
      value.snapshot,
      value.manifest,
      value.approvedManifestHash,
    );
    const stopAfter = value.stopAfter === undefined ? undefined : Number(value.stopAfter);
    return json(await importCheckinMigration(
      env.DB,
      verified.manifest as CheckinMigrationManifest,
      { stopAfter },
    ));
  } catch (error) {
    return migrationFailure(error);
  }
}

async function handleReconcile(request: Request, env: Env) {
  try {
    const value = await body(request);
    const verified = await verifySnapshotAndManifest(
      value.snapshot,
      value.manifest,
      value.approvedManifestHash,
    );
    return json(await reconcileCheckinMigration(
      env.DB,
      verified.manifest as CheckinMigrationManifest,
    ));
  } catch (error) {
    return migrationFailure(error);
  }
}

async function rawCount(url: URL, env: Env) {
  const ownerKey = url.searchParams.get("ownerKey") ?? "";
  const row = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM checkin_ledger WHERE owner_key = ?",
  ).bind(ownerKey).first<{ count: number }>();
  return json({ count: Number(row?.count ?? 0) });
}

async function rawOwner(url: URL, env: Env) {
  const ownerKey = url.searchParams.get("ownerKey") ?? "";
  const row = await env.DB.prepare(`
    SELECT owner_key, ledger_state, legacy_audit_fingerprint,
      legacy_observed_count, legacy_imported_count, activated_at
    FROM checkin_owners WHERE owner_key = ?
  `).bind(ownerKey).first();
  return json({ row });
}

async function seedIncompatible(request: Request, env: Env) {
  const value = await body(request);
  const ownerKey = String(value.ownerKey ?? "");
  const manifestHash = String(value.manifestHash ?? "");
  const batchId = String(value.batchId ?? "");
  const date = String(value.date ?? "");
  const pageId = String(value.pageId ?? "");
  const canonicalCount = Number(value.canonicalCount ?? 0);
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO checkin_owners (
        owner_key, ledger_state, legacy_audit_fingerprint,
        legacy_observed_count, legacy_imported_count, audit_completed_at
      ) VALUES (?, 'importing', ?, ?, 1, CURRENT_TIMESTAMP)
    `).bind(ownerKey, manifestHash, canonicalCount),
    env.DB.prepare(`
      INSERT INTO checkin_ledger (
        ledger_id, owner_key, checkin_date, payload_version,
        payload_fingerprint, payload_json, day_type, mood, energy,
        sleep_status, training_status, study_status, audiobook_minutes,
        dog_minutes, music_minutes, win, difficulty, next_step, summary,
        xp_day, origin, legacy_notion_page_id, import_batch_id
      ) VALUES (
        ?, ?, ?, 1, ?, ?, 'Trabalho', 'Ruim', 1,
        'Não feito', 'Não feito', 'Não feito', 0,
        0, 0, '', '', '', '', 0, 'legacy_import', ?, ?
      )
    `).bind(
      `incompatible:${crypto.randomUUID()}`,
      ownerKey,
      date,
      "f".repeat(64),
      JSON.stringify({ incompatible: true }),
      pageId,
      batchId,
    ),
  ]);
  return json({ seeded: true });
}

async function verifyRollback(env: Env) {
  const ownerKey = `local:migration-rollback-${crypto.randomUUID()}`;
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

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") return json({ ok: true });
    if (request.method === "POST" && url.pathname === "/migration/import") {
      return handleImport(request, env);
    }
    if (request.method === "POST" && url.pathname === "/migration/reconcile") {
      return handleReconcile(request, env);
    }
    if (request.method === "GET" && url.pathname === "/raw/count") return rawCount(url, env);
    if (request.method === "GET" && url.pathname === "/raw/owner") return rawOwner(url, env);
    if (request.method === "POST" && url.pathname === "/raw/seed-incompatible") {
      return seedIncompatible(request, env);
    }
    if (request.method === "POST" && url.pathname === "/raw/rollback") {
      return verifyRollback(env);
    }
    return json({ error: "Not found" }, 404);
  },
};
