import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Shaft application identity", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Shaft<\/title>/i);
  assert.match(html, />SHAFT</);
  assert.match(html, /class="brand-mark"[^>]*>⚙<\/div>/);
  assert.match(html, /href="\/icon-192\.png"/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps the Shaft source and install metadata aligned", async () => {
  const [page, layout, app, packageJson, manifest, serviceWorker, icon] =
    await Promise.all([
      readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/ShaftApp.tsx", import.meta.url), "utf8"),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
      readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
      readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
      readFile(new URL("../public/favicon.svg", import.meta.url), "utf8"),
    ]);

  assert.match(page, /import \{ ShaftApp \} from "\.\/ShaftApp"/);
  assert.match(layout, /title:\s*"Shaft"/);
  assert.match(app, /export function ShaftApp/);
  assert.match(app, />SHAFT</);
  assert.match(packageJson, /"name": "shaft-pwa"/);
  assert.match(manifest, /"name":"Shaft"/);
  assert.match(serviceWorker, /shaft-lobster-v3/);
  assert.match(icon, /<circle cx="256" cy="256" r="34"/);
});
