import { createHash } from "node:crypto";

export class MigrationArtifactError extends Error {
  constructor(message, code = "INVALID_ARTIFACT") {
    super(message);
    this.name = "MigrationArtifactError";
    this.code = code;
  }
}

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortValue(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(sortValue(value));
}

export function sha256Hex(value) {
  const content = typeof value === "string" ? value : canonicalJson(value);
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

export function withoutKey(value, key) {
  const copy = { ...value };
  delete copy[key];
  return copy;
}

export function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new MigrationArtifactError(`${label} deve ser um objeto.`, "INVALID_SHAPE");
  }
  return value;
}
