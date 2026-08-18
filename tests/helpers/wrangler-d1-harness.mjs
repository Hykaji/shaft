import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dirname, "..", "..");
const wranglerCli = path.join(repositoryRoot, "node_modules", "wrangler", "bin", "wrangler.js");
const migrationPath = path.join(repositoryRoot, "drizzle", "0000_checkin_ledger.sql");
const fixturePath = path.join(repositoryRoot, "tests", "fixtures", "checkin-d1-worker.ts");

function childEnvironment(root) {
  return {
    ...process.env,
    WRANGLER_LOG_PATH: path.join(root, "logs"),
    WRANGLER_SEND_METRICS: "false",
    CI: "true",
    XDG_CONFIG_HOME: path.join(root, "xdg"),
    MINIFLARE_REGISTRY_PATH: path.join(root, "state", "registry"),
  };
}

function runProcess(args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [wranglerCli, ...args], {
      cwd: repositoryRoot,
      env: options.env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(
        `Wrangler exited with code ${String(code)} and signal ${String(signal)}.\n${stdout}\n${stderr}`,
      ));
    });
  });
}

async function reserveLoopbackPort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert(address && typeof address === "object");
  const port = address.port;
  await new Promise((resolve, reject) => server.close((error) => {
    if (error) reject(error);
    else resolve();
  }));
  return port;
}

async function waitForHealth(baseUrl, child, output) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Wrangler stopped before health check.\n${output()}`);
    }
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      // The loopback listener is not ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for local D1 Worker.\n${output()}`);
}

async function stopChild(child, output) {
  if (child.exitCode !== null) return;
  const stopped = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Wrangler did not stop after termination request.\n${output()}`));
    }, 10_000);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
  const signaled = child.kill();
  if (!signaled) throw new Error("Wrangler refused the termination request.");
  await stopped;
  await new Promise((resolve) => setTimeout(resolve, 1_500));
}

function validateTemporaryRoot(root) {
  const resolvedRoot = path.resolve(root);
  const resolvedTemp = path.resolve(os.tmpdir());
  assert.equal(
    resolvedRoot.startsWith(`${resolvedTemp}${path.sep}`),
    true,
    "temporary root must remain below os.tmpdir()",
  );
  assert.equal(
    path.basename(resolvedRoot).startsWith("shaft-checkin-d1-"),
    true,
    "temporary root must retain the harness prefix",
  );
  return resolvedRoot;
}

async function rejectReparsePoints(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    const stats = await lstat(entryPath);
    if (stats.isSymbolicLink()) {
      throw new Error(`Unexpected link or reparse point in harness root: ${entryPath}`);
    }
    if (stats.isDirectory()) await rejectReparsePoints(entryPath);
  }
}

async function removeTemporaryRoot(root) {
  const validatedRoot = validateTemporaryRoot(root);
  await rejectReparsePoints(validatedRoot);
  await rm(validatedRoot, { recursive: true });
}

export async function startWranglerD1Harness({ applyMigration = true } = {}) {
  await lstat(wranglerCli);
  await lstat(fixturePath);
  if (applyMigration) await lstat(migrationPath);

  const root = validateTemporaryRoot(
    await mkdtemp(path.join(os.tmpdir(), "shaft-checkin-d1-")),
  );
  const configDirectory = path.join(root, "config");
  const logsDirectory = path.join(root, "logs");
  const stateDirectory = path.join(root, "state");
  const xdgDirectory = path.join(root, "xdg");
  await Promise.all([
    mkdir(configDirectory),
    mkdir(logsDirectory),
    mkdir(stateDirectory),
    mkdir(xdgDirectory),
  ]);

  const configPath = path.join(configDirectory, "wrangler.checkin-d1.jsonc");
  const config = {
    name: "shaft-checkin-d1-test",
    main: fixturePath,
    compatibility_date: "2026-05-22",
    compatibility_flags: ["nodejs_compat"],
    d1_databases: [{
      binding: "DB",
      database_name: "shaft-checkin-d1-test",
      database_id: "00000000-0000-4000-8000-000000000005",
    }],
  };
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

  const env = childEnvironment(root);
  const sharedArgs = ["--config", configPath, "--local", "--persist-to", stateDirectory];
  let child;
  let stdout = "";
  let stderr = "";

  try {
    if (applyMigration) {
      await runProcess([
        "d1", "execute", "DB",
        ...sharedArgs,
        "--file", migrationPath,
        "--yes",
      ], { env });
    }

    const port = await reserveLoopbackPort();
    child = spawn(process.execPath, [
      wranglerCli,
      "dev",
      "--config", configPath,
      "--local",
      "--ip", "127.0.0.1",
      "--port", String(port),
      "--persist-to", stateDirectory,
      "--log-level", "error",
      "--show-interactive-dev-session=false",
    ], {
      cwd: repositoryRoot,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    const output = () => `${stdout}\n${stderr}`;
    const baseUrl = `http://127.0.0.1:${port}`;
    await waitForHealth(baseUrl, child, output);

    let closed = false;
    return {
      baseUrl,
      paths: { root, configPath, logsDirectory, stateDirectory, xdgDirectory },
      output,
      async stop() {
        if (closed) return;
        closed = true;
        await stopChild(child, output);
        await removeTemporaryRoot(root);
      },
    };
  } catch (error) {
    if (child) await stopChild(child, () => `${stdout}\n${stderr}`).catch(() => {});
    await removeTemporaryRoot(root).catch(() => {});
    throw error;
  }
}
