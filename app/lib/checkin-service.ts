import {
  calculateCheckinXp,
  canonicalCheckinJson,
  fingerprintCheckinPayload,
  normalizeCheckinPayload,
} from "./checkin-payload.ts";
import type { NormalizedCheckin } from "./checkin-payload.ts";

export type CheckinLedgerRecord = {
  ledgerId: string;
  ownerKey: string;
  payload: NormalizedCheckin;
  payloadJson: string;
  payloadFingerprint: string;
  xpDay: number;
};

export type StoredCheckin = {
  ledgerId: string;
  checkinDate: string;
  payloadFingerprint: string;
  mood: string;
  energy: number;
  win: string;
  xpDay: number;
};

export type LedgerWriteResult = {
  kind: "created" | "replayed" | "conflict";
  record: StoredCheckin;
  xpTotal: number;
};

export type LedgerDashboard = {
  latest: StoredCheckin | null;
  xpTotal: number;
};

export interface CheckinLedgerPort {
  save(record: CheckinLedgerRecord): Promise<LedgerWriteResult>;
  getDashboard(ownerKey: string): Promise<LedgerDashboard>;
}

export class CheckinConflictError extends Error {
  constructor() {
    super("Já existe um check-in diferente para esta data.");
  }
}

export class CheckinStoreUnavailableError extends Error {
  constructor() {
    super("Check-ins e XP estão indisponíveis no momento.");
  }
}

export function createCheckinService(ledger: CheckinLedgerPort) {
  return {
    async save(ownerKey: string, body: Record<string, unknown>, now = new Date()) {
      const payload = normalizeCheckinPayload(body, now);
      const payloadJson = canonicalCheckinJson(payload);
      const payloadFingerprint = await fingerprintCheckinPayload(payload);
      const xpDay = calculateCheckinXp(payload);
      const result = await ledger.save({
        ledgerId: crypto.randomUUID(),
        ownerKey,
        payload,
        payloadJson,
        payloadFingerprint,
        xpDay,
      });

      if (result.kind === "conflict") throw new CheckinConflictError();

      const replayed = result.kind === "replayed";
      const previousTotal = result.xpTotal - (replayed ? 0 : result.record.xpDay);
      const level = Math.floor(result.xpTotal / 200) + 1;
      const previousLevel = Math.floor(previousTotal / 200) + 1;

      return {
        xpDay: result.record.xpDay,
        xpTotal: result.xpTotal,
        level,
        leveledUp: !replayed && level > previousLevel,
        replayed,
      };
    },

    getDashboard(ownerKey: string) {
      return ledger.getDashboard(ownerKey);
    },
  };
}
