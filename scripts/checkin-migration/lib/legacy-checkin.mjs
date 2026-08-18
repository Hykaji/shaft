import {
  calculateCheckinXp,
  canonicalCheckinJson,
  fingerprintCheckinPayload,
  normalizeCheckinPayload,
} from "../../../app/lib/checkin-payload.ts";
import {
  MigrationArtifactError,
  assertPlainObject,
  canonicalJson,
  cloneJson,
  sha256Hex,
} from "./canonical.mjs";

export const SNAPSHOT_FORMAT = "shaft-legacy-checkin-snapshot-v1";
export const MANIFEST_VERSION = 1;
export const LOCAL_OWNER_PREFIX = "local:";

const DAY_TYPES = new Set(["Trabalho", "Folga", "Férias"]);
const MOODS = new Set(["Ótimo", "Bom", "Neutro", "Ruim", "Muito ruim"]);
const STATUSES = new Set(["Completo", "Mínimo", "Não feito", "Não planejado"]);
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const OFFSET_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function validLogicalDate(value) {
  if (typeof value !== "string") return false;
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

function validTimestamp(value) {
  return typeof value === "string"
    && OFFSET_TIMESTAMP_PATTERN.test(value)
    && Number.isFinite(Date.parse(value));
}

function decisionKey(pageId, code) {
  return `${pageId}\0${code}`;
}

function normalizeDecisions(decisions) {
  const map = new Map();
  for (const value of decisions ?? []) {
    const decision = assertPlainObject(value, "decisão");
    const pageId = String(decision.pageId ?? "").trim();
    const code = String(decision.code ?? "").trim();
    const action = String(decision.action ?? "").trim();
    if (!pageId || !code || !action) {
      throw new MigrationArtifactError("Decisão local incompleta.", "INVALID_DECISION");
    }
    const key = decisionKey(pageId, code);
    if (map.has(key)) {
      throw new MigrationArtifactError("Decisão local duplicada.", "INVALID_DECISION");
    }
    map.set(key, {
      pageId,
      code,
      action,
      note: typeof decision.note === "string" ? decision.note : "",
    });
  }
  return map;
}

function anomaly(record, decisionMap, severity, code, field, message, acceptedAction) {
  const decision = decisionMap.get(decisionKey(record.pageId, code));
  const resolved = severity === "observation"
    || Boolean(acceptedAction && decision?.action === acceptedAction);
  const value = {
    severity,
    code,
    field,
    message,
    resolved,
  };
  if (decision) value.decision = decision;
  record.anomalies.push(value);
  return value;
}

function requiredString(record, raw, key, decisionMap) {
  const value = raw[key];
  if (typeof value !== "string") {
    anomaly(record, decisionMap, "blocker", "INVALID_STRING", key, `${key} deve ser texto.`);
    return null;
  }
  const normalized = value.trim().slice(0, 1000);
  if (normalized !== value) {
    anomaly(
      record,
      decisionMap,
      "review",
      `NORMALIZED_TEXT_${key}`,
      key,
      `${key} exige trim ou truncamento.`,
      "accept_normalized_candidate",
    );
  }
  return value;
}

function enumValue(record, raw, key, allowed, decisionMap) {
  const value = raw[key];
  if (typeof value !== "string" || !allowed.has(value)) {
    anomaly(record, decisionMap, "blocker", "INVALID_ENUM", key, `${key} possui valor inválido.`);
    return null;
  }
  return value;
}

function integerValue(record, raw, key, minimum, maximum, decisionMap) {
  const value = raw[key];
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    anomaly(record, decisionMap, "blocker", "INVALID_INTEGER", key, `${key} possui valor inválido.`);
    return null;
  }
  return value;
}

function parseRecord(rawInput, ownerMap, decisionMap) {
  const raw = cloneJson(assertPlainObject(rawInput, "registro legado"));
  const pageId = typeof raw.pageId === "string" ? raw.pageId.trim() : "";
  const record = {
    pageId,
    raw,
    rawHash: sha256Hex(raw),
    ownerKey: null,
    normalizedCandidate: null,
    payloadJson: null,
    payloadFingerprint: null,
    xpComparison: null,
    dogInference: null,
    anomalies: [],
  };
  if (!pageId) {
    anomaly(record, decisionMap, "blocker", "INVALID_PAGE_ID", "pageId", "pageId ausente ou inválido.");
  }

  const ownerRef = typeof raw.ownerRef === "string" ? raw.ownerRef : "";
  const ownerKey = ownerMap[ownerRef];
  if (typeof ownerKey !== "string" || !ownerKey.startsWith(LOCAL_OWNER_PREFIX)) {
    anomaly(record, decisionMap, "blocker", "OWNER_NOT_APPROVED", "ownerRef", "Owner não pertence ao mapa local aprovado.");
  } else {
    record.ownerKey = ownerKey;
  }

  for (const key of ["createdTime", "lastEditedTime"]) {
    if (!validTimestamp(raw[key])) {
      anomaly(record, decisionMap, "blocker", "INVALID_TIMESTAMP", key, `${key} exige timestamp com offset explícito.`);
    }
  }

  const properties = raw.properties && typeof raw.properties === "object" && !Array.isArray(raw.properties)
    ? raw.properties
    : null;
  if (!properties) {
    anomaly(record, decisionMap, "blocker", "INVALID_PROPERTIES", "properties", "properties deve ser um objeto.");
    return record;
  }

  const date = properties.date;
  if (!validLogicalDate(date)) {
    anomaly(record, decisionMap, "blocker", "INVALID_DATE", "date", "Data lógica inválida ou ausente.");
  }
  const title = requiredString(record, properties, "title", decisionMap);
  if (validLogicalDate(date) && title !== null && title !== `Check-in ${date}`) {
    anomaly(record, decisionMap, "observation", "TITLE_DATE_MISMATCH", "title", "Título não corresponde à data lógica.");
  }

  const dayType = enumValue(record, properties, "dayType", DAY_TYPES, decisionMap);
  const mood = enumValue(record, properties, "mood", MOODS, decisionMap);
  const sleep = enumValue(record, properties, "sleep", STATUSES, decisionMap);
  const training = enumValue(record, properties, "training", STATUSES, decisionMap);
  const study = enumValue(record, properties, "study", STATUSES, decisionMap);
  const energy = integerValue(record, properties, "energy", 1, 10, decisionMap);
  const audiobookMinutes = integerValue(record, properties, "audiobookMinutes", 0, 600, decisionMap);
  const musicMinutes = integerValue(record, properties, "musicMinutes", 0, 600, decisionMap);
  const legacyXp = integerValue(record, properties, "xpDay", 0, Number.MAX_SAFE_INTEGER, decisionMap);
  const win = requiredString(record, properties, "win", decisionMap);
  const difficulty = requiredString(record, properties, "difficulty", decisionMap);
  const nextStep = requiredString(record, properties, "nextStep", decisionMap);
  const summary = requiredString(record, properties, "summary", decisionMap);

  if (properties.xpTotal !== undefined && (!Number.isInteger(properties.xpTotal) || properties.xpTotal < 0)) {
    anomaly(record, decisionMap, "observation", "INVALID_XP_TOTAL_SNAPSHOT", "xpTotal", "XP total legado é apenas evidência inválida.");
  }
  if (properties.level !== undefined && (!Number.isInteger(properties.level) || properties.level < 1)) {
    anomaly(record, decisionMap, "observation", "INVALID_LEVEL_SNAPSHOT", "level", "Nível legado é apenas evidência inválida.");
  }

  let dogMinutes = null;
  if (properties.dogWalked === false) {
    dogMinutes = 0;
    record.dogInference = { kind: "exact_false", candidateMinutes: 0, lossy: false };
  } else if (properties.dogWalked === true) {
    const canCalculateBase = [
      date, dayType, mood, sleep, training, study, energy,
      audiobookMinutes, musicMinutes, legacyXp, win, difficulty, nextStep, summary,
    ].every((value) => value !== null && value !== undefined);
    if (canCalculateBase) {
      const basePayload = normalizeCheckinPayload({
        date, dayType, mood, sleep, training, study, energy,
        audiobookMinutes, dogMinutes: 0, musicMinutes,
        win, difficulty, nextStep, summary,
      });
      const dogXp = legacyXp - calculateCheckinXp(basePayload);
      dogMinutes = dogXp === 3 ? 10 : dogXp === 5 ? 20 : null;
    }
    if (dogMinutes === null) {
      anomaly(record, decisionMap, "blocker", "AMBIGUOUS_DOG_WALK", "dogWalked", "Passeio verdadeiro não permite inferência inequívoca do limiar.");
      record.dogInference = { kind: "ambiguous", candidateMinutes: null, lossy: true };
    } else {
      anomaly(
        record,
        decisionMap,
        "review",
        "LOSSY_DOG_THRESHOLD",
        "dogWalked",
        "Minutos representam apenas o limiar de XP, não o tempo histórico factual.",
        "accept_lossy_threshold_candidate",
      );
      record.dogInference = { kind: "threshold_representative", candidateMinutes: dogMinutes, lossy: true };
    }
  } else {
    anomaly(record, decisionMap, "blocker", "INVALID_DOG_WALK", "dogWalked", "Passeio deve ser booleano.");
  }

  const candidateValues = [
    date, dayType, mood, sleep, training, study, energy,
    audiobookMinutes, dogMinutes, musicMinutes, win, difficulty, nextStep, summary,
  ];
  if (candidateValues.some((value) => value === null || value === undefined)) return record;

  const payload = normalizeCheckinPayload({
    date, dayType, mood, sleep, training, study, energy,
    audiobookMinutes, dogMinutes, musicMinutes,
    win, difficulty, nextStep, summary,
  });
  const recalculatedXp = calculateCheckinXp(payload);
  record.normalizedCandidate = payload;
  record.payloadJson = canonicalCheckinJson(payload);
  record.xpComparison = {
    legacy: legacyXp,
    recalculated: recalculatedXp,
    matches: legacyXp === recalculatedXp,
  };
  if (legacyXp !== recalculatedXp) {
    anomaly(record, decisionMap, "blocker", "XP_DIVERGENCE", "xpDay", "XP legado diverge do XP recalculado.");
  }
  return record;
}

function summarizeAnomalies(records) {
  const summary = { blocker: 0, review: 0, observation: 0, unresolved: 0 };
  for (const record of records) {
    for (const item of record.anomalies) {
      summary[item.severity] += 1;
      if (!item.resolved) summary.unresolved += 1;
    }
  }
  return summary;
}

function groupRecords(records, decisionMap) {
  const groups = new Map();
  for (const record of records) {
    if (!record.ownerKey || !record.normalizedCandidate || !record.payloadFingerprint) continue;
    const key = `${record.ownerKey}\0${record.normalizedCandidate.date}`;
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }

  const items = [];
  const conflicts = [];
  for (const [, group] of [...groups.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    group.sort((left, right) => left.pageId.localeCompare(right.pageId));
    const fingerprints = new Set(group.map((record) => record.payloadFingerprint));
    if (fingerprints.size > 1) {
      const conflict = {
        ownerKey: group[0].ownerKey,
        checkinDate: group[0].normalizedCandidate.date,
        pageIds: group.map((record) => record.pageId),
        fingerprints: [...fingerprints].sort(),
      };
      conflicts.push(conflict);
      for (const record of group) {
        anomaly(record, decisionMap, "blocker", "DUPLICATE_CONFLICT", "checkinDate", "Duplicatas da mesma data possuem payloads diferentes.");
      }
      continue;
    }
    const canonical = group[0];
    items.push({
      ownerKey: canonical.ownerKey,
      checkinDate: canonical.normalizedCandidate.date,
      pageId: canonical.pageId,
      aliases: group.slice(1).map((record) => record.pageId),
      sourcePageIds: group.map((record) => record.pageId),
      sourceRawHashes: group.map((record) => ({ pageId: record.pageId, rawHash: record.rawHash })),
      payload: canonical.normalizedCandidate,
      payloadJson: canonical.payloadJson,
      payloadFingerprint: canonical.payloadFingerprint,
      xpLegacy: canonical.xpComparison.legacy,
      xpRecalculated: canonical.xpComparison.recalculated,
      dogInference: canonical.dogInference,
      anomalies: group.flatMap((record) => record.anomalies.map((item) => ({ ...item, pageId: record.pageId }))),
    });
  }
  return { items, conflicts };
}

export async function auditLegacySnapshot(snapshotInput, options = {}) {
  const snapshot = cloneJson(assertPlainObject(snapshotInput, "snapshot"));
  if (snapshot.format !== SNAPSHOT_FORMAT || snapshot.schemaVersion !== 1 || !Array.isArray(snapshot.records)) {
    throw new MigrationArtifactError("Snapshot possui formato ou versão inválidos.", "INVALID_SNAPSHOT");
  }
  const ownerMap = cloneJson(assertPlainObject(options.ownerMap ?? {}, "ownerMap"));
  for (const ownerKey of Object.values(ownerMap)) {
    if (typeof ownerKey !== "string" || !ownerKey.startsWith(LOCAL_OWNER_PREFIX)) {
      throw new MigrationArtifactError("Tooling local aceita somente owners locais falsos.", "NON_LOCAL_OWNER");
    }
  }
  const decisionMap = normalizeDecisions(options.decisions);
  const records = snapshot.records.map((raw) => parseRecord(raw, ownerMap, decisionMap));
  for (const record of records) {
    if (record.normalizedCandidate) {
      record.payloadFingerprint = await fingerprintCheckinPayload(record.normalizedCandidate);
    }
  }
  const duplicatePageIds = new Map();
  for (const record of records) {
    const entries = duplicatePageIds.get(record.pageId) ?? [];
    entries.push(record);
    duplicatePageIds.set(record.pageId, entries);
  }
  for (const group of duplicatePageIds.values()) {
    if (group.length > 1) {
      for (const record of group) {
        anomaly(record, decisionMap, "blocker", "DUPLICATE_PAGE_ID", "pageId", "pageId aparece mais de uma vez no snapshot.");
      }
    }
  }

  const { items, conflicts } = groupRecords(records, decisionMap);
  const canonicalSetHash = sha256Hex(items.map((item) => ({
    ownerKey: item.ownerKey,
    checkinDate: item.checkinDate,
    pageId: item.pageId,
    aliases: item.aliases,
    payloadFingerprint: item.payloadFingerprint,
    xpRecalculated: item.xpRecalculated,
  })));
  const batchId = `checkins-v1-${canonicalSetHash.slice(0, 16)}`;
  for (const item of items) {
    item.ledgerId = `legacy:${sha256Hex(`${item.ownerKey}\0${item.pageId}`).slice(0, 40)}`;
    item.importBatchId = batchId;
  }

  const snapshotHash = sha256Hex(snapshot);
  const decisions = [...decisionMap.values()].sort((left, right) =>
    canonicalJson(left).localeCompare(canonicalJson(right)));
  const anomalySummary = summarizeAnomalies(records);
  const unresolved = records.flatMap((record) =>
    record.anomalies
      .filter((item) => !item.resolved)
      .map((item) => ({ pageId: record.pageId, code: item.code, severity: item.severity })));
  const ownerKeys = [...new Set(items.map((item) => item.ownerKey))].sort();
  const approval = options.approval === "local-fixture-approved" && snapshot.source === "synthetic-fixture"
    ? { status: "approved", authority: "synthetic-local-fixture" }
    : { status: "draft", authority: null };
  const manifest = {
    manifestVersion: MANIFEST_VERSION,
    ownerMap,
    snapshot: {
      format: snapshot.format,
      hash: snapshotHash,
      rawCount: records.length,
    },
    batchId,
    approval,
    ownerKeys,
    legacyObservedCount: items.length,
    canonicalCount: items.length,
    records,
    items,
    conflicts,
    decisions,
    anomalies: anomalySummary,
    unresolved,
    hashes: {
      snapshot: snapshotHash,
      canonicalSet: canonicalSetHash,
    },
    importable: approval.status === "approved"
      && ownerKeys.length === 1
      && ownerKeys[0].startsWith(LOCAL_OWNER_PREFIX)
      && unresolved.length === 0
      && conflicts.length === 0,
  };
  manifest.manifestHash = sha256Hex(manifest);
  return manifest;
}
