import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { lstat, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dirname, "..", "..");
const wranglerCli = path.join(repositoryRoot, "node_modules", "wrangler", "bin", "wrangler.js");
const migrationPath = path.join(repositoryRoot, "drizzle", "0000_checkin_ledger.sql");
const fixturePath = path.join(repositoryRoot, "tests", "fixtures", "checkin-migration-worker.ts");

function environment(root) {
  return {
    ...process.env,
    WRANGLER_LOG_PATH: path.join(root, "logs"),
    WRANGLER_SEND_METRICS: "false",
    CI: "true",
    XDG_CONFIG_HOME: path.join(root, "xdg"),
    MINIFLARE_REGISTRY_PATH: path.join(root, "state", "registry"),
  };
}

function validateRoot(root) {
  const resolved = path.resolve(root);
  const temporary = path.resolve(os.tmpdir());
  assert.equal(resolved.startsWith(`${temporary}${path.sep}`), true);
  assert.equal(path.basename(resolved).startsWith("shaft-checkin-migration-"), true);
  return resolved;
}

async function rejectLinks(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    const stats = await lstat(entryPath);
    if (stats.isSymbolicLink()) throw new Error(`Link inesperado no harness: ${entryPath}`);
    if (stats.isDirectory()) await rejectLinks(entryPath);
  }
}

async function removeRoot(root) {
  const validated = validateRoot(root);
  await rejectLinks(validated);
  await rm(validated, { recursive: true });
}

function runWrangler(args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [wranglerCli, ...args], {
      cwd: repositoryRoot,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`Wrangler falhou (${String(code)}).\n${output}`));
    });
  });
}

async function reservePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert(address && typeof address === "object");
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

async function waitForHealth(baseUrl, child, output) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Worker local encerrou cedo.\n${output()}`);
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      // Listener local ainda não está pronto.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timeout do Worker D1 local.\n${output()}`);
}

async function stopChild(child, output) {
  if (child.exitCode !== null) return;
  const stopped = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Wrangler não encerrou.\n${output()}`)), 10_000);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
  if (!child.kill()) throw new Error("Wrangler recusou encerramento.");
  await stopped;
  await new Promise((resolve) => setTimeout(resolve, 1_500));
}

export async function startWranglerCheckinMigrationHarness() {
  await Promise.all([lstat(wranglerCli), lstat(migrationPath), lstat(fixturePath)]);
  const root = validateRoot(await mkdtemp(path.join(os.tmpdir(), "shaft-checkin-migration-")));
  const configDirectory = path.join(root, "config");
  const logsDirectory = path.join(root, "logs");
  const stateDirectory = path.join(root, "state");
  const xdgDirectory = path.join(root, "xdg");
  await Promise.all([
    mkdir(configDirectory), mkdir(logsDirectory), mkdir(stateDirectory), mkdir(xdgDirectory),
  ]);
  const configPath = path.join(configDirectory, "wrangler.checkin-migration.jsonc");
  await writeFile(configPath, `${JSON.stringify({
    name: "shaft-checkin-migration-test",
    main: fixturePath,
    compatibility_date: "2026-05-22",
    compatibility_flags: ["nodejs_compat"],
    d1_databases: [{
      binding: "DB",
      database_name: "shaft-checkin-migration-test",
      database_id: "00000000-0000-4000-8000-000000000006",
    }],
  }, null, 2)}\n`, "utf8");
  const env = environment(root);
  const shared = ["--config", configPath, "--local", "--persist-to", stateDirectory];
  let child;
  let output = "";
  try {
    await runWrangler([
      "d1", "execute", "DB", ...shared, "--file", migrationPath, "--yes",
    ], env);
    const port = await reservePort();
    child = spawn(process.execPath, [
      wranglerCli, "dev", "--config", configPath, "--local",
      "--ip", "127.0.0.1", "--port", String(port),
      "--persist-to", stateDirectory, "--log-level", "error",
      "--show-interactive-dev-session=false",
    ], {
      cwd: repositoryRoot,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    const getOutput = () => output;
    const baseUrl = `http://127.0.0.1:${port}`;
    await waitForHealth(baseUrl, child, getOutput);
    let stopped = false;
    return {
      baseUrl,
      paths: { root, configPath, logsDirectory, stateDirectory, xdgDirectory },
      output: getOutput,
      async stop() {
        if (stopped) return;
        stopped = true;
        await stopChild(child, getOutput);
        await removeRoot(root);
      },
    };
  } catch (error) {
    if (child) await stopChild(child, () => output).catch(() => {});
    await removeRoot(root).catch(() => {});
    throw error;
  }
}
