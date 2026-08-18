type MigrationAnomaly = {
  severity: "blocker" | "review" | "observation";
  resolved: boolean;
};

type MigrationD1PreparedStatement = {
  bind(...values: unknown[]): MigrationD1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
  run(): Promise<unknown>;
};

export type CheckinMigrationD1Database = {
  prepare(sql: string): MigrationD1PreparedStatement;
  batch<T = unknown>(statements: MigrationD1PreparedStatement[]): Promise<T[]>;
};

type MigrationItem = {
  ledgerId: string;
  ownerKey: string;
  checkinDate: string;
  pageId: string;
  aliases: string[];
  sourcePageIds: string[];
  payload: {
    payloadVersion: number;
    date: string;
    dayType: string;
    mood: string;
    energy: number;
    sleep: string;
    training: string;
    study: string;
    audiobookMinutes: number;
    dogMinutes: number;
    musicMinutes: number;
    win: string;
    difficulty: string;
    nextStep: string;
    summary: string;
  };
  payloadJson: string;
  payloadFingerprint: string;
  xpLegacy: number;
  xpRecalculated: number;
  importBatchId: string;
  anomalies: MigrationAnomaly[];
};

export type CheckinMigrationManifest = {
  manifestVersion: number;
  manifestHash: string;
  batchId: string;
  approval: { status: string };
  ownerKeys: string[];
  legacyObservedCount: number;
  canonicalCount: number;
  importable: boolean;
  unresolved: unknown[];
  conflicts: unknown[];
  hashes: { snapshot: string; canonicalSet: string };
  items: MigrationItem[];
};

type OwnerRow = {
  owner_key: string;
  ledger_state: string;
  legacy_audit_fingerprint: string | null;
  legacy_observed_count: number | null;
  legacy_imported_count: number | null;
  activated_at: string | null;
};

type LedgerRow = {
  ledger_id: string;
  owner_key: string;
  checkin_date: string;
  payload_version: number;
  payload_fingerprint: string;
  payload_json: string;
  day_type: string;
  mood: string;
  energy: number;
  sleep_status: string;
  training_status: string;
  study_status: string;
  audiobook_minutes: number;
  dog_minutes: number;
  music_minutes: number;
  win: string;
  difficulty: string;
  next_step: string;
  summary: string;
  xp_day: number;
  origin: string;
  legacy_notion_page_id: string | null;
  import_batch_id: string | null;
};

export class CheckinMigrationError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "CheckinMigrationError";
    this.code = code;
  }
}

const OWNER_SQL = `
  SELECT owner_key, ledger_state, legacy_audit_fingerprint,
    legacy_observed_count, legacy_imported_count, activated_at
  FROM checkin_owners
  WHERE owner_key = ?
`;

const ROW_SQL = `
  SELECT ledger_id, owner_key, checkin_date, payload_version,
    payload_fingerprint, payload_json, day_type, mood, energy,
    sleep_status, training_status, study_status, audiobook_minutes,
    dog_minutes, music_minutes, win, difficulty, next_step, summary,
    xp_day, origin, legacy_notion_page_id, import_batch_id
  FROM checkin_ledger
  WHERE (owner_key = ? AND checkin_date = ?)
     OR legacy_notion_page_id = ?
`;

const INSERT_ROW_SQL = `
  INSERT INTO checkin_ledger (
    ledger_id, owner_key, checkin_date, payload_version,
    payload_fingerprint, payload_json, day_type, mood, energy,
    sleep_status, training_status, study_status, audiobook_minutes,
    dog_minutes, music_minutes, win, difficulty, next_step, summary,
    xp_day, origin, legacy_notion_page_id, import_batch_id
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
    'legacy_import', ?, ?
  )
  ON CONFLICT(owner_key, checkin_date) DO NOTHING
`;

function assertManifest(manifest: CheckinMigrationManifest) {
  const ownerKey = manifest.ownerKeys?.[0];
  if (
    manifest.manifestVersion !== 1
    || manifest.approval?.status !== "approved"
    || !manifest.importable
    || manifest.ownerKeys?.length !== 1
    || !ownerKey?.startsWith("local:")
    || manifest.manifestHash?.length !== 64
    || manifest.unresolved?.length !== 0
    || manifest.conflicts?.length !== 0
    || manifest.items?.length !== manifest.canonicalCount
    || manifest.canonicalCount !== manifest.legacyObservedCount
  ) {
    throw new CheckinMigrationError("Manifesto não está apto para importação local.", "INVALID_MANIFEST");
  }
  for (const item of manifest.items) {
    if (
      item.ownerKey !== ownerKey
      || item.checkinDate !== item.payload.date
      || item.importBatchId !== manifest.batchId
      || item.xpLegacy !== item.xpRecalculated
      || item.anomalies.some((anomaly) => anomaly.severity !== "observation" && !anomaly.resolved)
    ) {
      throw new CheckinMigrationError("Manifesto contém item não resolvido.", "UNRESOLVED_ITEM");
    }
  }
  return ownerKey;
}

function expectedRow(item: MigrationItem): LedgerRow {
  return {
    ledger_id: item.ledgerId,
    owner_key: item.ownerKey,
    checkin_date: item.checkinDate,
    payload_version: item.payload.payloadVersion,
    payload_fingerprint: item.payloadFingerprint,
    payload_json: item.payloadJson,
    day_type: item.payload.dayType,
    mood: item.payload.mood,
    energy: item.payload.energy,
    sleep_status: item.payload.sleep,
    training_status: item.payload.training,
    study_status: item.payload.study,
    audiobook_minutes: item.payload.audiobookMinutes,
    dog_minutes: item.payload.dogMinutes,
    music_minutes: item.payload.musicMinutes,
    win: item.payload.win,
    difficulty: item.payload.difficulty,
    next_step: item.payload.nextStep,
    summary: item.payload.summary,
    xp_day: item.xpRecalculated,
    origin: "legacy_import",
    legacy_notion_page_id: item.pageId,
    import_batch_id: item.importBatchId,
  };
}

function sameRow(actual: LedgerRow, expected: LedgerRow) {
  return (Object.keys(expected) as (keyof LedgerRow)[])
    .every((key) => actual[key] === expected[key]);
}

function insertBindings(item: MigrationItem) {
  const row = expectedRow(item);
  return [
    row.ledger_id,
    row.owner_key,
    row.checkin_date,
    row.payload_version,
    row.payload_fingerprint,
    row.payload_json,
    row.day_type,
    row.mood,
    row.energy,
    row.sleep_status,
    row.training_status,
    row.study_status,
    row.audiobook_minutes,
    row.dog_minutes,
    row.music_minutes,
    row.win,
    row.difficulty,
    row.next_step,
    row.summary,
    row.xp_day,
    row.legacy_notion_page_id,
    row.import_batch_id,
  ];
}

async function readOwner(db: CheckinMigrationD1Database, ownerKey: string) {
  return await db.prepare(OWNER_SQL).bind(ownerKey).first<OwnerRow>();
}

function assertCompatibleOwner(owner: OwnerRow, manifest: CheckinMigrationManifest) {
  if (
    owner.ledger_state !== "importing"
    || owner.legacy_audit_fingerprint !== manifest.manifestHash
    || Number(owner.legacy_observed_count) !== manifest.legacyObservedCount
    || owner.activated_at !== null
  ) {
    throw new CheckinMigrationError(
      "Owner já está associado a outro batch ou manifesto.",
      "INCOMPATIBLE_OWNER",
    );
  }
}

async function ensureOwner(
  db: CheckinMigrationD1Database,
  ownerKey: string,
  manifest: CheckinMigrationManifest,
) {
  const owner = await readOwner(db, ownerKey);
  if (owner) {
    assertCompatibleOwner(owner, manifest);
    return;
  }
  try {
    await db.prepare(`
      INSERT INTO checkin_owners (
        owner_key, ledger_state, legacy_audit_fingerprint,
        legacy_observed_count, legacy_imported_count, audit_completed_at
      ) VALUES (?, 'importing', ?, ?, 0, CURRENT_TIMESTAMP)
    `).bind(ownerKey, manifest.manifestHash, manifest.legacyObservedCount).run();
  } catch {
    const concurrentOwner = await readOwner(db, ownerKey);
    if (!concurrentOwner) {
      throw new CheckinMigrationError("Falha ao preparar owner local.", "OWNER_PREPARATION_FAILED");
    }
    assertCompatibleOwner(concurrentOwner, manifest);
  }
}

async function preflightRows(db: CheckinMigrationD1Database, items: MigrationItem[]) {
  const results = await db.batch(items.map((item) =>
    db.prepare(ROW_SQL).bind(item.ownerKey, item.checkinDate, item.pageId))) as unknown as Array<{
      results?: LedgerRow[];
    }>;
  const existing = new Set<string>();
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const rows = results[index]?.results ?? [];
    if (rows.length > 1 || (rows.length === 1 && !sameRow(rows[0], expectedRow(item)))) {
      throw new CheckinMigrationError(
        `Linha existente incompatível para ${item.checkinDate}.`,
        "INCOMPATIBLE_EXISTING_ROW",
      );
    }
    if (rows.length === 1) existing.add(item.ledgerId);
  }
  return existing;
}

async function currentImportedCount(
  db: CheckinMigrationD1Database,
  ownerKey: string,
  batchId: string,
) {
  const row = await db.prepare(`
    SELECT COUNT(*) AS count
    FROM checkin_ledger
    WHERE owner_key = ? AND import_batch_id = ? AND origin = 'legacy_import'
  `).bind(ownerKey, batchId).first<{ count: number }>();
  return Number(row?.count ?? 0);
}

export async function importCheckinMigration(
  db: CheckinMigrationD1Database,
  manifest: CheckinMigrationManifest,
  options: { stopAfter?: number; chunkSize?: number } = {},
) {
  const ownerKey = assertManifest(manifest);
  const stopAfter = options.stopAfter ?? manifest.items.length;
  const chunkSize = options.chunkSize ?? 25;
  if (!Number.isInteger(stopAfter) || stopAfter < 0 || !Number.isInteger(chunkSize) || chunkSize < 1) {
    throw new CheckinMigrationError("Limites de importação inválidos.", "INVALID_IMPORT_LIMIT");
  }
  const selectedItems = manifest.items.slice(0, Math.min(stopAfter, manifest.items.length));
  const existing = await preflightRows(db, manifest.items);
  await ensureOwner(db, ownerKey, manifest);
  let created = 0;
  let replayed = 0;

  for (let offset = 0; offset < selectedItems.length; offset += chunkSize) {
    const chunk = selectedItems.slice(offset, offset + chunkSize);
    const missing = chunk.filter((item) => !existing.has(item.ledgerId));
    replayed += chunk.length - missing.length;
    if (missing.length > 0) {
      await db.batch([
        ...missing.map((item) => db.prepare(INSERT_ROW_SQL).bind(...insertBindings(item))),
        db.prepare(`
          UPDATE checkin_owners
          SET legacy_imported_count = (
            SELECT COUNT(*) FROM checkin_ledger
            WHERE owner_key = ? AND import_batch_id = ? AND origin = 'legacy_import'
          ), updated_at = CURRENT_TIMESTAMP
          WHERE owner_key = ? AND ledger_state = 'importing'
            AND legacy_audit_fingerprint = ?
        `).bind(ownerKey, manifest.batchId, ownerKey, manifest.manifestHash),
      ]);
      created += missing.length;
      await preflightRows(db, chunk);
    }
  }

  const importedCount = await currentImportedCount(db, ownerKey, manifest.batchId);
  return {
    ownerKey,
    batchId: manifest.batchId,
    manifestHash: manifest.manifestHash,
    created,
    replayed,
    importedCount,
    canonicalCount: manifest.canonicalCount,
    complete: importedCount === manifest.canonicalCount,
  };
}

export async function reconcileCheckinMigration(
  db: CheckinMigrationD1Database,
  manifest: CheckinMigrationManifest,
) {
  const ownerKey = assertManifest(manifest);
  const owner = await readOwner(db, ownerKey);
  if (!owner) throw new CheckinMigrationError("Owner da importação não existe.", "OWNER_MISSING");
  assertCompatibleOwner(owner, manifest);
  const result = await db.prepare(`
    SELECT ledger_id, owner_key, checkin_date, payload_version,
      payload_fingerprint, payload_json, day_type, mood, energy,
      sleep_status, training_status, study_status, audiobook_minutes,
      dog_minutes, music_minutes, win, difficulty, next_step, summary,
      xp_day, origin, legacy_notion_page_id, import_batch_id
    FROM checkin_ledger
    WHERE owner_key = ?
    ORDER BY checkin_date ASC
  `).bind(ownerKey).all<LedgerRow>();
  const rows = result.results ?? [];
  if (rows.length !== manifest.items.length) {
    throw new CheckinMigrationError("Quantidade de linhas não reconcilia.", "RECONCILIATION_COUNT_MISMATCH");
  }
  const byDate = new Map(rows.map((row) => [row.checkin_date, row]));
  for (const item of manifest.items) {
    const row = byDate.get(item.checkinDate);
    if (!row || !sameRow(row, expectedRow(item))) {
      throw new CheckinMigrationError(
        `Linha não reconcilia para ${item.checkinDate}.`,
        "RECONCILIATION_ROW_MISMATCH",
      );
    }
  }
  const dates = [...byDate.keys()].sort();
  const xpTotal = rows.reduce((total, row) => total + Number(row.xp_day), 0);
  const expectedXpTotal = manifest.items.reduce((total, item) => total + item.xpRecalculated, 0);
  if (xpTotal !== expectedXpTotal) {
    throw new CheckinMigrationError("XP total não reconcilia.", "RECONCILIATION_XP_MISMATCH");
  }
  const ownerCount = Number(owner.legacy_imported_count ?? -1);
  if (ownerCount !== manifest.canonicalCount) {
    throw new CheckinMigrationError("Contagem do owner não reconcilia.", "RECONCILIATION_OWNER_MISMATCH");
  }
  return {
    reconciled: true,
    ownerKey,
    batchId: manifest.batchId,
    manifestHash: manifest.manifestHash,
    snapshotHash: manifest.hashes.snapshot,
    canonicalSetHash: manifest.hashes.canonicalSet,
    rawCount: manifest.items.reduce((total, item) => total + item.sourcePageIds.length, 0),
    canonicalCount: manifest.canonicalCount,
    dates,
    xpTotal,
    latestCheckinDate: dates.at(-1) ?? null,
    provenance: rows.map((row) => ({
      checkinDate: row.checkin_date,
      pageId: row.legacy_notion_page_id,
      origin: row.origin,
      importBatchId: row.import_batch_id,
      payloadFingerprint: row.payload_fingerprint,
    })),
  };
}
