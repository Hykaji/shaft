import { assertLocalTarget, verifySnapshotAndManifest } from "./lib/manifest.mjs";
import { pathToFileURL } from "node:url";
import {
  parseArgs,
  postLocalJson,
  readJson,
  requireArg,
  runCli,
  writeJson,
} from "./lib/cli.mjs";

export async function runImportCommand(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const target = requireArg(args, "target");
  const baseUrl = assertLocalTarget(target, requireArg(args, "base-url"));
  const snapshot = await readJson(requireArg(args, "snapshot"));
  const manifest = await readJson(requireArg(args, "manifest"));
  const approvedManifestHash = requireArg(args, "approved-manifest-hash");
  await verifySnapshotAndManifest(snapshot, manifest, approvedManifestHash);
  const stopAfter = args["stop-after"] === undefined
    ? undefined
    : Number(args["stop-after"]);
  if (stopAfter !== undefined && (!Number.isInteger(stopAfter) || stopAfter < 0)) {
    throw Object.assign(new Error("--stop-after deve ser inteiro não negativo."), { code: "INVALID_ARGUMENT" });
  }
  const result = await postLocalJson(baseUrl, "/migration/import", {
    snapshot,
    manifest,
    approvedManifestHash,
    stopAfter,
  });
  if (args.output) await writeJson(args.output, result);
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) runCli(runImportCommand);
