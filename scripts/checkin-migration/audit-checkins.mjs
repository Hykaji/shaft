import { auditLegacySnapshot } from "./lib/legacy-checkin.mjs";
import { parseArgs, readJson, requireArg, runCli, writeJson } from "./lib/cli.mjs";
import { pathToFileURL } from "node:url";

export async function runAuditCommand(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const snapshot = await readJson(requireArg(args, "snapshot"));
  const ownerMap = await readJson(requireArg(args, "owner-map"));
  const decisions = args.decisions ? await readJson(args.decisions) : [];
  const manifest = await auditLegacySnapshot(snapshot, {
    ownerMap,
    decisions,
    approval: args["approve-local-fixture"] === true ? "local-fixture-approved" : "draft",
  });
  await writeJson(requireArg(args, "output"), manifest);
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) runCli(runAuditCommand);
