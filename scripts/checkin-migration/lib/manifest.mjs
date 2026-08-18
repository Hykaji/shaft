import {
  MigrationArtifactError,
  assertPlainObject,
  canonicalJson,
  cloneJson,
  sha256Hex,
  withoutKey,
} from "./canonical.mjs";
import {
  auditLegacySnapshot,
  LOCAL_OWNER_PREFIX,
  MANIFEST_VERSION,
  SNAPSHOT_FORMAT,
} from "./legacy-checkin.mjs";

const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export async function verifySnapshotAndManifest(
  snapshotInput,
  manifestInput,
  expectedApprovalHashInput,
) {
  const snapshot = cloneJson(assertPlainObject(snapshotInput, "snapshot"));
  const manifest = cloneJson(assertPlainObject(manifestInput, "manifesto"));
  const expectedApprovalHash = typeof expectedApprovalHashInput === "string"
    ? expectedApprovalHashInput.trim().toLowerCase()
    : "";
  if (!SHA256_PATTERN.test(expectedApprovalHash)) {
    throw new MigrationArtifactError(
      "Hash de aprovação independente é obrigatório.",
      "APPROVAL_HASH_REQUIRED",
    );
  }
  if (snapshot.format !== SNAPSHOT_FORMAT || snapshot.schemaVersion !== 1) {
    throw new MigrationArtifactError("Snapshot inválido.", "INVALID_SNAPSHOT");
  }
  if (manifest.manifestVersion !== MANIFEST_VERSION) {
    throw new MigrationArtifactError("Versão do manifesto inválida.", "INVALID_MANIFEST");
  }
  const snapshotHash = sha256Hex(snapshot);
  if (snapshotHash !== manifest.snapshot?.hash || snapshotHash !== manifest.hashes?.snapshot) {
    throw new MigrationArtifactError("Hash do snapshot diverge do manifesto.", "SNAPSHOT_HASH_MISMATCH");
  }
  const manifestHash = sha256Hex(withoutKey(manifest, "manifestHash"));
  if (manifestHash !== manifest.manifestHash) {
    throw new MigrationArtifactError("Hash do manifesto inválido.", "MANIFEST_HASH_MISMATCH");
  }
  if (manifestHash !== expectedApprovalHash) {
    throw new MigrationArtifactError(
      "Manifesto diverge do hash aprovado independentemente.",
      "APPROVAL_HASH_MISMATCH",
    );
  }
  if (!Array.isArray(manifest.decisions)) {
    throw new MigrationArtifactError("Decisões do manifesto são inválidas.", "INVALID_MANIFEST");
  }
  const ownerMap = cloneJson(assertPlainObject(manifest.ownerMap, "ownerMap do manifesto"));
  const rederived = await auditLegacySnapshot(snapshot, {
    ownerMap,
    decisions: manifest.decisions,
    approval: "local-fixture-approved",
  });
  if (canonicalJson(rederived) !== canonicalJson(manifest)) {
    throw new MigrationArtifactError(
      "Manifesto não deriva integralmente do snapshot e das decisões aprovadas.",
      "MANIFEST_DERIVATION_MISMATCH",
    );
  }
  if (!Array.isArray(manifest.ownerKeys)
      || manifest.ownerKeys.length !== 1
      || !manifest.ownerKeys[0].startsWith(LOCAL_OWNER_PREFIX)) {
    throw new MigrationArtifactError("Manifesto não possui owner local único.", "NON_LOCAL_OWNER");
  }
  if (!Array.isArray(manifest.items)
      || manifest.items.length !== manifest.canonicalCount
      || manifest.items.length !== manifest.legacyObservedCount) {
    throw new MigrationArtifactError("Contagem canônica inconsistente.", "COUNT_MISMATCH");
  }
  if ((manifest.unresolved?.length ?? 0) > 0
      || (manifest.conflicts?.length ?? 0) > 0
      || manifest.items.some((item) => item.xpLegacy !== item.xpRecalculated)) {
    throw new MigrationArtifactError("Manifesto contém item não resolvido.", "UNRESOLVED_ITEM");
  }
  if (manifest.approval?.status !== "approved" || !manifest.importable) {
    throw new MigrationArtifactError("Manifesto não está aprovado para importação.", "MANIFEST_NOT_APPROVED");
  }
  const seenDates = new Set();
  const seenPages = new Set();
  for (const item of manifest.items) {
    if (item.ownerKey !== manifest.ownerKeys[0] || item.importBatchId !== manifest.batchId) {
      throw new MigrationArtifactError("Proveniência do item é inconsistente.", "INVALID_PROVENANCE");
    }
    const dateKey = `${item.ownerKey}\0${item.checkinDate}`;
    if (seenDates.has(dateKey)) {
      throw new MigrationArtifactError("Data canônica duplicada.", "DUPLICATE_CANONICAL_DATE");
    }
    seenDates.add(dateKey);
    for (const pageId of item.sourcePageIds) {
      if (seenPages.has(pageId)) {
        throw new MigrationArtifactError("Página de origem repetida.", "DUPLICATE_SOURCE_PAGE");
      }
      seenPages.add(pageId);
    }
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(item.payloadJson);
    } catch {
      throw new MigrationArtifactError("Payload JSON do item é inválido.", "PAYLOAD_JSON_MISMATCH");
    }
    if (canonicalJson(parsedPayload) !== canonicalJson(item.payload)) {
      throw new MigrationArtifactError("Payload JSON do item é inconsistente.", "PAYLOAD_JSON_MISMATCH");
    }
  }
  return { snapshot, manifest, ownerKey: manifest.ownerKeys[0] };
}

export function assertLocalTarget(target, baseUrl) {
  if (target !== "local") {
    throw new MigrationArtifactError("Target remoto é proibido nesta fase.", "REMOTE_TARGET_REJECTED");
  }
  const url = new URL(baseUrl);
  if (url.protocol !== "http:" || url.hostname !== "127.0.0.1") {
    throw new MigrationArtifactError("Importação aceita somente loopback local.", "REMOTE_TARGET_REJECTED");
  }
  return url.origin;
}
