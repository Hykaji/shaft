import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { MigrationArtifactError } from "./canonical.mjs";

export function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      throw new MigrationArtifactError(`Argumento inesperado: ${token}`, "INVALID_ARGUMENT");
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

export function requireArg(args, key) {
  const value = args[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new MigrationArtifactError(`Argumento --${key} é obrigatório.`, "INVALID_ARGUMENT");
  }
  return value;
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(path.resolve(filePath), "utf8"));
}

export async function writeJson(filePath, value) {
  await writeFile(path.resolve(filePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function postLocalJson(baseUrl, pathname, body) {
  const requestUrl = new URL(pathname, baseUrl);
  let response;
  try {
    response = await fetch(requestUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      redirect: "error",
    });
  } catch (error) {
    const causeMessage = error?.cause instanceof Error ? error.cause.message : "";
    if (/redirect/i.test(`${error instanceof Error ? error.message : ""} ${causeMessage}`)) {
      throw new MigrationArtifactError(
        "Redirecionamento local foi recusado.",
        "LOCAL_REDIRECT_REJECTED",
      );
    }
    throw error;
  }
  if (response.status >= 300 && response.status <= 399
      || response.redirected
      || (response.url && response.url !== requestUrl.href)) {
    throw new MigrationArtifactError(
      "Redirecionamento local foi recusado.",
      "LOCAL_REDIRECT_REJECTED",
    );
  }
  const payload = await response.json();
  if (!response.ok) {
    throw new MigrationArtifactError(
      typeof payload?.error === "string" ? payload.error : "Falha no D1 local.",
      typeof payload?.code === "string" ? payload.code : "LOCAL_D1_FAILURE",
    );
  }
  return payload;
}

export function runCli(main) {
  main().catch((error) => {
    const code = typeof error?.code === "string" ? error.code : "UNEXPECTED_FAILURE";
    process.stderr.write(`${code}: ${error instanceof Error ? error.message : "Falha inesperada."}\n`);
    process.exitCode = 1;
  });
}
