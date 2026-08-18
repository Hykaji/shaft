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

export async function runReconcileCommand(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const baseUrl = assertLocalTarget(
    requireArg(args, "target"),
    requireArg(args, "base-url"),
  );
  const snapshot = await readJson(requireArg(args, "snapshot"));
  const manifest = await readJson(requireArg(args, "manifest"));
  const approvedManifestHash = requireArg(args, "approved-manifest-hash");
  await verifySnapshotAndManifest(snapshot, manifest, approvedManifestHash);
  const result = await postLocalJson(baseUrl, "/migration/reconcile", {
    snapshot,
    manifest,
    approvedManifestHash,
  });
  if (args.output) await writeJson(args.output, result);
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) runCli(runReconcileCommand);
