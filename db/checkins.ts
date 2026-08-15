import {
  CheckinStoreUnavailableError,
} from "../app/lib/checkin-service.ts";
import type {
  CheckinLedgerPort,
  CheckinLedgerRecord,
  LedgerDashboard,
  LedgerWriteResult,
  StoredCheckin,
} from "../app/lib/checkin-service.ts";

type QueryResult<T> = { results?: T[] };

type OwnerRow = {
  ledger_state: string;
  legacy_audit_fingerprint: string | null;
  legacy_observed_count: number | null;
  legacy_imported_count: number | null;
  audit_completed_at: string | null;
  activated_at: string | null;
};

type StoredRow = {
  ledger_id: string;
  checkin_date: string;
  payload_fingerprint: string;
  mood: string;
  energy: number;
  win: string;
  xp_day: number;
};

const OWNER_STATE_SQL = `
  SELECT
    ledger_state,
    legacy_audit_fingerprint,
    legacy_observed_count,
    legacy_imported_count,
    audit_completed_at,
    activated_at
  FROM checkin_owners
  WHERE owner_key = ?
`;

const READY_OWNER_SQL = `
  SELECT 1
  FROM checkin_owners
  WHERE owner_key = ?
    AND ledger_state = 'ready'
    AND legacy_audit_fingerprint IS NOT NULL
    AND length(legacy_audit_fingerprint) = 64
    AND legacy_observed_count IS NOT NULL
    AND legacy_imported_count = legacy_observed_count
    AND audit_completed_at IS NOT NULL
    AND activated_at IS NOT NULL
`;

const INSERT_SQL = `
  INSERT INTO checkin_ledger (
    ledger_id,
    owner_key,
    checkin_date,
    payload_version,
    payload_fingerprint,
    payload_json,
    day_type,
    mood,
    energy,
    sleep_status,
    training_status,
    study_status,
    audiobook_minutes,
    dog_minutes,
    music_minutes,
    win,
    difficulty,
    next_step,
    summary,
    xp_day,
    origin,
    legacy_notion_page_id,
    import_batch_id
  )
  SELECT
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'live', NULL, NULL
  WHERE EXISTS (${READY_OWNER_SQL})
  ON CONFLICT(owner_key, checkin_date) DO NOTHING
  RETURNING ledger_id
`;

const STORED_ROW_SQL = `
  SELECT
    ledger_id,
    checkin_date,
    payload_fingerprint,
    mood,
    energy,
    win,
    xp_day
  FROM checkin_ledger
  WHERE owner_key = ? AND checkin_date = ?
`;

const LATEST_ROW_SQL = `
  SELECT
    ledger_id,
    checkin_date,
    payload_fingerprint,
    mood,
    energy,
    win,
    xp_day
  FROM checkin_ledger
  WHERE owner_key = ?
  ORDER BY checkin_date DESC
  LIMIT 1
`;

const TOTAL_SQL = `
  SELECT COALESCE(SUM(xp_day), 0) AS xp_total
  FROM checkin_ledger
  WHERE owner_key = ?
`;

function first<T>(result: QueryResult<T> | undefined) {
  return result?.results?.[0];
}

function isReadyOwner(owner: OwnerRow | undefined) {
  return Boolean(
    owner &&
      owner.ledger_state === "ready" &&
      owner.legacy_audit_fingerprint?.length === 64 &&
      owner.legacy_observed_count !== null &&
      owner.legacy_imported_count === owner.legacy_observed_count &&
      owner.audit_completed_at &&
      owner.activated_at,
  );
}

function mapStoredRow(row: StoredRow): StoredCheckin {
  return {
    ledgerId: row.ledger_id,
    checkinDate: row.checkin_date,
    payloadFingerprint: row.payload_fingerprint,
    mood: row.mood,
    energy: Number(row.energy),
    win: row.win,
    xpDay: Number(row.xp_day),
  };
}

function totalFrom(result: QueryResult<{ xp_total: number }> | undefined) {
  return Number(first(result)?.xp_total ?? 0);
}

function insertBindings(record: CheckinLedgerRecord) {
  const { payload } = record;
  return [
    record.ledgerId,
    record.ownerKey,
    payload.date,
    payload.payloadVersion,
    record.payloadFingerprint,
    record.payloadJson,
    payload.dayType,
    payload.mood,
    payload.energy,
    payload.sleep,
    payload.training,
    payload.study,
    payload.audiobookMinutes,
    payload.dogMinutes,
    payload.musicMinutes,
    payload.win,
    payload.difficulty,
    payload.nextStep,
    payload.summary,
    record.xpDay,
    record.ownerKey,
  ];
}

export function createD1CheckinLedger(db: D1Database): CheckinLedgerPort {
  return {
    async save(record): Promise<LedgerWriteResult> {
      try {
        const results = await db.batch([
          db.prepare(OWNER_STATE_SQL).bind(record.ownerKey),
          db.prepare(INSERT_SQL).bind(...insertBindings(record)),
          db.prepare(STORED_ROW_SQL).bind(record.ownerKey, record.payload.date),
          db.prepare(TOTAL_SQL).bind(record.ownerKey),
        ]) as unknown as [
          QueryResult<OwnerRow>,
          QueryResult<{ ledger_id: string }>,
          QueryResult<StoredRow>,
          QueryResult<{ xp_total: number }>,
        ];

        if (!isReadyOwner(first(results[0]))) {
          throw new CheckinStoreUnavailableError();
        }

        const stored = first(results[2]);
        if (!stored) throw new CheckinStoreUnavailableError();

        const inserted = Boolean(first(results[1]));
        const kind = inserted
          ? "created"
          : stored.payload_fingerprint === record.payloadFingerprint
            ? "replayed"
            : "conflict";

        return {
          kind,
          record: mapStoredRow(stored),
          xpTotal: totalFrom(results[3]),
        };
      } catch (error) {
        if (error instanceof CheckinStoreUnavailableError) throw error;
        throw new CheckinStoreUnavailableError();
      }
    },

    async getDashboard(ownerKey): Promise<LedgerDashboard> {
      try {
        const results = await db.batch([
          db.prepare(OWNER_STATE_SQL).bind(ownerKey),
          db.prepare(LATEST_ROW_SQL).bind(ownerKey),
          db.prepare(TOTAL_SQL).bind(ownerKey),
        ]) as unknown as [
          QueryResult<OwnerRow>,
          QueryResult<StoredRow>,
          QueryResult<{ xp_total: number }>,
        ];

        if (!isReadyOwner(first(results[0]))) {
          throw new CheckinStoreUnavailableError();
        }

        const latest = first(results[1]);
        return {
          latest: latest ? mapStoredRow(latest) : null,
          xpTotal: totalFrom(results[2]),
        };
      } catch (error) {
        if (error instanceof CheckinStoreUnavailableError) throw error;
        throw new CheckinStoreUnavailableError();
      }
    },
  };
}
