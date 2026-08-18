export const CHECKIN_PAYLOAD_VERSION = 1;

const statuses = ["Completo", "Mínimo", "Não feito", "Não planejado"] as const;
const moods = ["Ótimo", "Bom", "Neutro", "Ruim", "Muito ruim"] as const;
const dayTypes = ["Trabalho", "Folga", "Férias"] as const;

export type CheckinStatus = (typeof statuses)[number];
export type CheckinMood = (typeof moods)[number];
export type CheckinDayType = (typeof dayTypes)[number];

export type NormalizedCheckin = {
  payloadVersion: number;
  date: string;
  dayType: CheckinDayType;
  mood: CheckinMood;
  energy: number;
  sleep: CheckinStatus;
  training: CheckinStatus;
  study: CheckinStatus;
  audiobookMinutes: number;
  dogMinutes: number;
  musicMinutes: number;
  win: string;
  difficulty: string;
  nextStep: string;
  summary: string;
};

function today(now: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(now);
}

function validDate(value: unknown): string | null {
  const candidate = String(value ?? "");
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(candidate);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return candidate;
}

function clean(value: unknown, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

function integerInRange(value: unknown, minimum: number, maximum: number, fallback: number) {
  const number = Number(value);
  const normalized = Number.isFinite(number) && number !== 0
    ? Math.trunc(number)
    : fallback;
  return Math.max(minimum, Math.min(maximum, normalized));
}

function allowed<T extends readonly string[]>(values: T, value: unknown, fallback: T[number]) {
  const candidate = String(value);
  return (values as readonly string[]).includes(candidate)
    ? candidate as T[number]
    : fallback;
}

export function normalizeCheckinPayload(
  body: Record<string, unknown>,
  now = new Date(),
): NormalizedCheckin {
  const date = validDate(body.date) ?? today(now);
  const sleep = allowed(statuses, body.sleep, "Não planejado");
  const training = allowed(statuses, body.training, "Não planejado");
  const study = allowed(statuses, body.study, "Não planejado");
  const mood = allowed(moods, body.mood, "Neutro");
  const dayType = allowed(dayTypes, body.dayType, "Trabalho");
  const energy = integerInRange(body.energy, 1, 10, 5);
  const audiobookMinutes = integerInRange(body.audiobookMinutes, 0, 600, 0);
  const dogMinutes = integerInRange(body.dogMinutes, 0, 300, 0);
  const musicMinutes = integerInRange(body.musicMinutes, 0, 600, 0);
  const win = clean(body.win);
  const difficulty = clean(body.difficulty);
  const nextStep = clean(body.nextStep);
  const summary = clean(body.summary) ||
    `Humor ${mood.toLowerCase()}, energia ${energy}. ${win ? `Vitória: ${win}` : "Check-in concluído sem cobrança."}`;

  return {
    payloadVersion: CHECKIN_PAYLOAD_VERSION,
    date,
    dayType,
    mood,
    energy,
    sleep,
    training,
    study,
    audiobookMinutes,
    dogMinutes,
    musicMinutes,
    win,
    difficulty,
    nextStep,
    summary,
  };
}

function score(status: CheckinStatus, minimum: number, complete: number) {
  if (status === "Completo") return complete;
  if (status === "Mínimo") return minimum;
  return 0;
}

export function calculateCheckinXp(payload: NormalizedCheckin) {
  return Math.max(
    0,
    score(payload.sleep, 5, 10) +
      score(payload.training, 10, 20) +
      score(payload.study, 8, 15) +
      (payload.audiobookMinutes >= 15 ? 5 : payload.audiobookMinutes >= 5 ? 2 : 0) +
      (payload.dogMinutes >= 20 ? 5 : payload.dogMinutes >= 10 ? 3 : 0) +
      (payload.musicMinutes >= 30 ? 10 : payload.musicMinutes >= 10 ? 5 : 0),
  );
}

export function canonicalCheckinJson(payload: NormalizedCheckin) {
  return JSON.stringify(payload);
}

export async function fingerprintCheckinPayload(payload: NormalizedCheckin) {
  const bytes = new TextEncoder().encode(canonicalCheckinJson(payload));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
