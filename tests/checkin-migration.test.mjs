import assert from "node:assert/strict";
import { once } from "node:events";
import { lstat, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import test, { after, before } from "node:test";
import { auditLegacySnapshot } from "../scripts/checkin-migration/lib/legacy-checkin.mjs";
import {
  MigrationArtifactError,
  sha256Hex,
  withoutKey,
} from "../scripts/checkin-migration/lib/canonical.mjs";
import { postLocalJson } from "../scripts/checkin-migration/lib/cli.mjs";
import {
  assertLocalTarget,
  verifySnapshotAndManifest,
} from "../scripts/checkin-migration/lib/manifest.mjs";
import { runImportCommand } from "../scripts/checkin-migration/import-checkins-d1.mjs";
import { runReconcileCommand } from "../scripts/checkin-migration/reconcile-checkins-d1.mjs";
import { startWranglerCheckinMigrationHarness } from "./helpers/wrangler-checkin-migration-harness.mjs";

const fixtures = new URL("./fixtures/checkin-migration/", import.meta.url);
const ownerRef = "legacy-personal";
const localOwner = "local:mission-06-clean";

async function fixture(name) {
  return JSON.parse(await readFile(new URL(name, fixtures), "utf8"));
}

function clone(value) {
  return structuredClone(value);
}

function rehashManifest(manifest) {
  manifest.manifestHash = sha256Hex(withoutKey(manifest, "manifestHash"));
  return manifest;
}

async function localServer(handler) {
  const server = createServer(handler);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.equal(typeof address, "object");
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    port: address.port,
    async close() {
      server.close();
      await once(server, "close");
    },
  };
}

function dogDecisions(snapshot) {
  return snapshot.records
    .filter((record) => record.properties?.dogWalked === true)
    .map((record) => ({
      pageId: record.pageId,
      code: "LOSSY_DOG_THRESHOLD",
      action: "accept_lossy_threshold_candidate",
      note: "Decisão sintética para teste local.",
    }));
}

async function approvedManifest(snapshot, ownerKey = localOwner, decisions = dogDecisions(snapshot)) {
  return await auditLegacySnapshot(snapshot, {
    ownerMap: { [ownerRef]: ownerKey },
    decisions,
    approval: "local-fixture-approved",
  });
}

function assertLoopback(baseUrl) {
  const url = new URL(baseUrl);
  assert.equal(url.protocol, "http:");
  assert.equal(url.hostname, "127.0.0.1");
}

async function requestJson(baseUrl, pathname, init) {
  assertLoopback(baseUrl);
  const response = await fetch(`${baseUrl}${pathname}`, init);
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { error: "Non-JSON response from local fixture.", raw: text.slice(0, 200) };
  }
  return { response, body };
}

async function postJson(baseUrl, pathname, value) {
  return requestJson(baseUrl, pathname, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value),
  });
}

async function auditFor(ownerKey, snapshot = cleanSnapshot) {
  return approvedManifest(snapshot, ownerKey);
}

function prefixedCleanSnapshot(prefix) {
  const snapshot = clone(cleanSnapshot);
  for (const record of snapshot.records) record.pageId = `${prefix}-${record.pageId}`;
  return snapshot;
}

async function rejectLinks(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    const stats = await lstat(entryPath);
    assert.equal(stats.isSymbolicLink(), false);
    if (stats.isDirectory()) await rejectLinks(entryPath);
  }
}

async function artifactFiles(snapshot, manifest) {
  const root = await mkdtemp(path.join(os.tmpdir(), "shaft-migration-artifacts-"));
  const snapshotPath = path.join(root, "snapshot.json");
  const manifestPath = path.join(root, "manifest.json");
  await Promise.all([
    writeFile(snapshotPath, JSON.stringify(snapshot), "utf8"),
    writeFile(manifestPath, JSON.stringify(manifest), "utf8"),
  ]);
  return {
    snapshotPath,
    manifestPath,
    async remove() {
      const resolved = path.resolve(root);
      assert.equal(resolved.startsWith(`${path.resolve(os.tmpdir())}${path.sep}`), true);
      assert.equal(path.basename(resolved).startsWith("shaft-migration-artifacts-"), true);
      await rejectLinks(resolved);
      await rm(resolved, { recursive: true });
    },
  };
}

const cleanSnapshot = await fixture("notion-clean.json");
const anomaliesSnapshot = await fixture("notion-anomalies.json");
const duplicatesSnapshot = await fixture("notion-duplicates.json");

test("strict parser preserves raw values separately from normalized candidates", async () => {
  const manifest = await approvedManifest(cleanSnapshot);
  const first = manifest.records[0];

  assert.deepEqual(first.raw, cleanSnapshot.records[0]);
  assert.notStrictEqual(first.raw, first.normalizedCandidate);
  assert.equal(first.raw.properties.dogWalked, false);
  assert.equal(first.normalizedCandidate.dogMinutes, 0);
  assert.equal(first.rawHash.length, 64);
  assert.equal(first.payloadFingerprint.length, 64);

  const invalid = await auditLegacySnapshot(anomaliesSnapshot, {
    ownerMap: { [ownerRef]: localOwner },
    approval: "local-fixture-approved",
  });
  const codes = new Set(invalid.records.flatMap((record) => record.anomalies.map((item) => item.code)));
  assert.equal(codes.has("INVALID_DATE"), true);
  assert.equal(codes.has("INVALID_INTEGER"), true);
  assert.equal(codes.has("INVALID_ENUM"), true);
  assert.equal(codes.has("INVALID_TIMESTAMP"), true);
  assert.equal(invalid.anomalies.blocker > 0, true);
  assert.equal(invalid.anomalies.observation > 0, true);
  assert.equal(invalid.importable, false);
});

test("snapshot, payload, set and manifest hashes are deterministic", async () => {
  const first = await approvedManifest(cleanSnapshot);
  const second = await approvedManifest(clone(cleanSnapshot));
  assert.equal(first.hashes.snapshot, second.hashes.snapshot);
  assert.equal(first.hashes.canonicalSet, second.hashes.canonicalSet);
  assert.equal(first.manifestHash, second.manifestHash);
  assert.deepEqual(
    first.items.map((item) => item.payloadFingerprint),
    second.items.map((item) => item.payloadFingerprint),
  );

  const changed = clone(cleanSnapshot);
  changed.records[0].properties.xpTotal += 1;
  const changedManifest = await approvedManifest(changed);
  assert.notEqual(first.hashes.snapshot, changedManifest.hashes.snapshot);
  assert.notEqual(first.manifestHash, changedManifest.manifestHash);
  assert.equal(first.items[0].payloadFingerprint, changedManifest.items[0].payloadFingerprint);
});

test("identical duplicates become aliases while conflicting duplicates block their group", async () => {
  const manifest = await auditLegacySnapshot(duplicatesSnapshot, {
    ownerMap: { [ownerRef]: localOwner },
    approval: "local-fixture-approved",
  });
  assert.equal(manifest.snapshot.rawCount, 4);
  assert.equal(manifest.canonicalCount, 1);
  assert.equal(manifest.legacyObservedCount, 1);
  assert.equal(manifest.items[0].pageId, "duplicate-a");
  assert.deepEqual(manifest.items[0].aliases, ["duplicate-b"]);
  assert.deepEqual(manifest.items[0].sourcePageIds, ["duplicate-a", "duplicate-b"]);
  assert.equal(manifest.conflicts.length, 1);
  assert.deepEqual(manifest.conflicts[0].pageIds, ["conflict-a", "conflict-b"]);
  assert.equal(manifest.importable, false);
});

test("XP is shown side by side and dog thresholds remain explicitly lossy", async () => {
  const manifest = await approvedManifest(cleanSnapshot);
  assert.deepEqual(
    manifest.items.map((item) => ({
      date: item.checkinDate,
      legacy: item.xpLegacy,
      recalculated: item.xpRecalculated,
      dogMinutes: item.payload.dogMinutes,
      inference: item.dogInference.kind,
      lossy: item.dogInference.lossy,
    })),
    [
      { date: "2026-08-10", legacy: 35, recalculated: 35, dogMinutes: 0, inference: "exact_false", lossy: false },
      { date: "2026-08-11", legacy: 28, recalculated: 28, dogMinutes: 10, inference: "threshold_representative", lossy: true },
      { date: "2026-08-12", legacy: 35, recalculated: 35, dogMinutes: 20, inference: "threshold_representative", lossy: true },
    ],
  );
  assert.equal(manifest.decisions.length, 2);
  assert.equal(manifest.importable, true);
});

test("ambiguous dog walks and XP divergence remain unresolved blockers", async () => {
  const manifest = await auditLegacySnapshot(anomaliesSnapshot, {
    ownerMap: { [ownerRef]: localOwner },
    approval: "local-fixture-approved",
  });
  const ambiguous = manifest.records.find((record) => record.pageId === "ambiguous-dog");
  const divergent = manifest.records.find((record) => record.pageId === "xp-divergence");
  assert.equal(ambiguous.dogInference.kind, "ambiguous");
  assert.equal(ambiguous.normalizedCandidate, null);
  assert.equal(ambiguous.anomalies.some((item) => item.code === "AMBIGUOUS_DOG_WALK" && !item.resolved), true);
  assert.deepEqual(divergent.xpComparison, { legacy: 19, recalculated: 18, matches: false });
  assert.equal(divergent.anomalies.some((item) => item.code === "XP_DIVERGENCE" && !item.resolved), true);
  await assert.rejects(
    async () => verifySnapshotAndManifest(anomaliesSnapshot, manifest, manifest.manifestHash),
    (error) => error instanceof MigrationArtifactError && error.code === "UNRESOLVED_ITEM",
  );
});

test("only fake local owners and explicit loopback targets are accepted", async () => {
  const foreign = await auditLegacySnapshot(cleanSnapshot, {
    ownerMap: { [ownerRef]: "chatgpt:real-owner-is-forbidden" },
  }).catch((error) => error);
  assert.equal(foreign instanceof MigrationArtifactError, true);
  assert.equal(foreign.code, "NON_LOCAL_OWNER");
  assert.equal(assertLocalTarget("local", "http://127.0.0.1:8787"), "http://127.0.0.1:8787");
  assert.throws(
    () => assertLocalTarget("remote", "https://api.cloudflare.com"),
    (error) => error instanceof MigrationArtifactError && error.code === "REMOTE_TARGET_REJECTED",
  );
  await assert.rejects(
    runImportCommand(["--target", "remote", "--base-url", "https://api.cloudflare.com"]),
    (error) => error instanceof MigrationArtifactError && error.code === "REMOTE_TARGET_REJECTED",
  );
});

test("tampered snapshot or manifest is rejected before D1 access", async () => {
  const manifest = await approvedManifest(cleanSnapshot);
  const changedSnapshot = clone(cleanSnapshot);
  changedSnapshot.records[0].properties.win = "adulterado";
  await assert.rejects(
    verifySnapshotAndManifest(changedSnapshot, manifest, manifest.manifestHash),
    (error) => error instanceof MigrationArtifactError && error.code === "SNAPSHOT_HASH_MISMATCH",
  );
  const changedManifest = clone(manifest);
  changedManifest.items[0].xpRecalculated += 1;
  await assert.rejects(
    verifySnapshotAndManifest(cleanSnapshot, changedManifest, manifest.manifestHash),
    (error) => error instanceof MigrationArtifactError && error.code === "MANIFEST_HASH_MISMATCH",
  );
});

test("independent approval hash and full re-derivation reject rehashed derived tampering", async () => {
  const manifest = await approvedManifest(cleanSnapshot);
  await assert.rejects(
    verifySnapshotAndManifest(cleanSnapshot, manifest),
    (error) => error instanceof MigrationArtifactError && error.code === "APPROVAL_HASH_REQUIRED",
  );
  const independentlyRejected = rehashManifest(clone(manifest));
  independentlyRejected.items[0].payloadFingerprint = "f".repeat(64);
  rehashManifest(independentlyRejected);
  await assert.rejects(
    verifySnapshotAndManifest(cleanSnapshot, independentlyRejected, manifest.manifestHash),
    (error) => error instanceof MigrationArtifactError && error.code === "APPROVAL_HASH_MISMATCH",
  );

  const mutations = [
    ["raw hash", (value) => { value.records[0].rawHash = "a".repeat(64); }],
    ["normalized candidate", (value) => { value.records[0].normalizedCandidate.win = "forjado"; }],
    ["payload json", (value) => { value.items[0].payloadJson = JSON.stringify({ forged: true }); }],
    ["payload fingerprint", (value) => { value.items[0].payloadFingerprint = "b".repeat(64); }],
    ["xp", (value) => { value.items[0].xpLegacy += 1; value.items[0].xpRecalculated += 1; }],
    ["aliases and source ids", (value) => {
      value.items[0].aliases.push("forged-alias");
      value.items[0].sourcePageIds.push("forged-alias");
    }],
    ["survivor", (value) => { value.items[0].pageId = "forged-survivor"; }],
    ["counts", (value) => { value.canonicalCount += 1; value.legacyObservedCount += 1; }],
    ["canonical set", (value) => { value.hashes.canonicalSet = "c".repeat(64); }],
    ["batch and ids", (value) => {
      value.batchId = "checkins-v1-forged";
      value.items[0].importBatchId = value.batchId;
      value.items[0].ledgerId = "legacy:forged";
    }],
    ["owner date and provenance", (value) => {
      value.ownerKeys[0] = "local:forged-owner";
      value.items[0].ownerKey = value.ownerKeys[0];
      value.items[0].checkinDate = "2026-08-30";
    }],
    ["anomalies", (value) => { value.items[0].anomalies.push({ severity: "observation", resolved: true }); }],
    ["conflicts", (value) => { value.conflicts.push({ forged: true }); }],
    ["decisions", (value) => { value.decisions[0].action = "forged-action"; }],
    ["approval", (value) => { value.approval.authority = "forged-authority"; }],
  ];
  for (const [label, mutate] of mutations) {
    const tampered = clone(manifest);
    mutate(tampered);
    rehashManifest(tampered);
    await assert.rejects(
      verifySnapshotAndManifest(cleanSnapshot, tampered, tampered.manifestHash),
      (error) => error instanceof MigrationArtifactError,
      label,
    );
  }
});

test("local POST refuses every redirect status without contacting any destination", async () => {
  let sinkHits = 0;
  const sink = await localServer((_request, response) => {
    sinkHits += 1;
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ reached: true }));
  });
  let status = 307;
  let location = `${sink.baseUrl}/captured`;
  let redirectHits = 0;
  const redirector = await localServer((_request, response) => {
    redirectHits += 1;
    response.writeHead(status, { location });
    response.end();
  });
  try {
    const destinations = [
      `${sink.baseUrl}/alternate-loopback`,
      `http://localhost:${sink.port}/localhost`,
      `http://[::1]:${sink.port}/ipv6`,
      "https://example.invalid/external",
    ];
    for (const redirectStatus of [301, 302, 303, 307, 308]) {
      for (const destination of destinations) {
        status = redirectStatus;
        location = destination;
        await assert.rejects(
          postLocalJson(redirector.baseUrl, "/redirect", { private: "synthetic-fixture" }),
          (error) => error instanceof MigrationArtifactError
            && error.code === "LOCAL_REDIRECT_REJECTED",
        );
      }
    }
    assert.equal(redirectHits, 20);
    assert.equal(sinkHits, 0);
  } finally {
    await redirector.close();
    await sink.close();
  }
});

test("mission tooling contains no Notion query or real exporter", async () => {
  const paths = [
    "../scripts/checkin-migration/audit-checkins.mjs",
    "../scripts/checkin-migration/import-checkins-d1.mjs",
    "../scripts/checkin-migration/reconcile-checkins-d1.mjs",
    "../scripts/checkin-migration/lib/legacy-checkin.mjs",
    "../scripts/checkin-migration/lib/manifest.mjs",
    "../db/checkin-migration.ts",
  ];
  const sources = await Promise.all(paths.map((value) => readFile(new URL(value, import.meta.url), "utf8")));
  for (const source of sources) {
    assert.doesNotMatch(source, /api\.notion\.com|SOURCES\.checkins|queryAllPages|createPage/);
  }
  await assert.rejects(readFile(new URL("../scripts/checkin-migration/export-notion-checkins.mjs", import.meta.url)));
});

let harness;
let d1Queue = Promise.resolve();

function d1Test(name, callback) {
  test(name, async (context) => {
    const previous = d1Queue;
    let release;
    d1Queue = new Promise((resolve) => { release = resolve; });
    await previous;
    try {
      await callback(context);
    } finally {
      release();
    }
  });
}

before(async () => {
  harness = await startWranglerCheckinMigrationHarness();
});

after(async () => {
  if (harness) await harness.stop();
});

d1Test("clean local D1 import, replay and reconciliation use approved artifacts", async () => {
  const manifest = await auditFor(localOwner);
  const artifacts = await artifactFiles(cleanSnapshot, manifest);
  try {
    const args = [
      "--target", "local",
      "--base-url", harness.baseUrl,
      "--snapshot", artifacts.snapshotPath,
      "--manifest", artifacts.manifestPath,
      "--approved-manifest-hash", manifest.manifestHash,
    ];
    const imported = await runImportCommand(args);
    assert.deepEqual(
      { created: imported.created, replayed: imported.replayed, count: imported.importedCount, complete: imported.complete },
      { created: 3, replayed: 0, count: 3, complete: true },
    );
    const replay = await runImportCommand(args);
    assert.deepEqual(
      { created: replay.created, replayed: replay.replayed, count: replay.importedCount, complete: replay.complete },
      { created: 0, replayed: 3, count: 3, complete: true },
    );
    const reconciliation = await runReconcileCommand(args);
    assert.equal(reconciliation.reconciled, true);
    assert.equal(reconciliation.rawCount, 3);
    assert.equal(reconciliation.canonicalCount, 3);
    assert.equal(reconciliation.xpTotal, 98);
    assert.equal(reconciliation.latestCheckinDate, "2026-08-12");
    assert.deepEqual(reconciliation.dates, ["2026-08-10", "2026-08-11", "2026-08-12"]);
    assert.equal(reconciliation.manifestHash, manifest.manifestHash);
    assert.equal(reconciliation.snapshotHash, manifest.hashes.snapshot);
    assert.equal(reconciliation.provenance.every((row) =>
      row.origin === "legacy_import" && row.importBatchId === manifest.batchId), true);
    const owner = await requestJson(
      harness.baseUrl,
      `/raw/owner?ownerKey=${encodeURIComponent(localOwner)}`,
    );
    assert.equal(owner.body.row.ledger_state, "importing");
    assert.equal(owner.body.row.legacy_observed_count, 3);
    assert.equal(owner.body.row.legacy_imported_count, 3);
    assert.equal(owner.body.row.activated_at, null);
  } finally {
    await artifacts.remove();
  }
});

d1Test("interrupted import resumes only the same batch and manifest", async () => {
  const ownerKey = "local:mission-06-resume";
  const resumeSnapshot = prefixedCleanSnapshot("resume");
  const manifest = await auditFor(ownerKey, resumeSnapshot);
  const first = await postJson(harness.baseUrl, "/migration/import", {
    snapshot: resumeSnapshot,
    manifest,
    approvedManifestHash: manifest.manifestHash,
    stopAfter: 1,
  });
  assert.equal(first.response.status, 200, JSON.stringify(first.body));
  assert.deepEqual(
    { created: first.body.created, importedCount: first.body.importedCount, complete: first.body.complete },
    { created: 1, importedCount: 1, complete: false },
  );
  const resumed = await postJson(harness.baseUrl, "/migration/import", {
    snapshot: resumeSnapshot,
    manifest,
    approvedManifestHash: manifest.manifestHash,
  });
  assert.equal(resumed.response.status, 200);
  assert.deepEqual(
    { created: resumed.body.created, replayed: resumed.body.replayed, importedCount: resumed.body.importedCount, complete: resumed.body.complete },
    { created: 2, replayed: 1, importedCount: 3, complete: true },
  );

  const otherSnapshot = clone(resumeSnapshot);
  otherSnapshot.records[0].properties.xpTotal += 1;
  const otherManifest = await auditFor(ownerKey, otherSnapshot);
  const refused = await postJson(harness.baseUrl, "/migration/import", {
    snapshot: otherSnapshot,
    manifest: otherManifest,
    approvedManifestHash: otherManifest.manifestHash,
  });
  assert.equal(refused.response.status, 409);
  assert.equal(refused.body.code, "INCOMPATIBLE_OWNER");
  const count = await requestJson(
    harness.baseUrl,
    `/raw/count?ownerKey=${encodeURIComponent(ownerKey)}`,
  );
  assert.equal(count.body.count, 3);
});

d1Test("an incompatible existing row aborts before adding remaining rows", async () => {
  const ownerKey = "local:mission-06-incompatible";
  const incompatibleSnapshot = prefixedCleanSnapshot("incompatible");
  const manifest = await auditFor(ownerKey, incompatibleSnapshot);
  const seed = await postJson(harness.baseUrl, "/raw/seed-incompatible", {
    ownerKey,
    manifestHash: manifest.manifestHash,
    batchId: manifest.batchId,
    canonicalCount: manifest.canonicalCount,
    date: manifest.items[0].checkinDate,
    pageId: manifest.items[0].pageId,
  });
  assert.equal(seed.response.status, 200, JSON.stringify(seed.body));
  const imported = await postJson(harness.baseUrl, "/migration/import", {
    snapshot: incompatibleSnapshot,
    manifest,
    approvedManifestHash: manifest.manifestHash,
  });
  assert.equal(imported.response.status, 409);
  assert.equal(imported.body.code, "INCOMPATIBLE_EXISTING_ROW");
  const count = await requestJson(
    harness.baseUrl,
    `/raw/count?ownerKey=${encodeURIComponent(ownerKey)}`,
  );
  assert.equal(count.body.count, 1);
});

d1Test("real D1 batch rolls back all statements on a constraint failure", async () => {
  const rollback = await postJson(harness.baseUrl, "/raw/rollback", {});
  assert.equal(rollback.response.status, 200);
  assert.deepEqual(rollback.body, { rejected: true, count: 0 });
});
