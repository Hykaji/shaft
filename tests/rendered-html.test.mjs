import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildTrainingExercisePayload,
  createTrainingFormItems,
  dashboardReducer,
  getValidExercises,
  initialDashboardState,
  isTrainingFormValid,
  parseEditableLoad,
  parseSupportedLoad,
  shouldShowRetryAction,
  updateTrainingFormLoad,
} from "../app/lib/dashboard-state.ts";

const dashboardData = {
  syncedAt: "12/08/2026",
  level: 2,
  xp: 230,
  nextLevel: 400,
  balance: "R$ 100,00",
  week: "Semana atual",
  checkin: { date: "12 de agosto", mood: "Bom", energy: 7, win: "Teste" },
  exercises: [["Supino", "30 kg", "Peito"]],
};

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
  assert.match(html, /Consultando o Notion/);
  assert.doesNotMatch(html, /R\$ 415,27|05\/08\/2026/);
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

test("transitions through loading, available, unavailable and retry", () => {
  assert.deepEqual(initialDashboardState, {
    notion: null,
    syncStatus: "loading",
    latestRequestId: 0,
    retrying: false,
  });

  const started = dashboardReducer(initialDashboardState, { type: "start", requestId: 1, kind: "initial" });
  const available = dashboardReducer(started, { type: "success", requestId: 1, data: dashboardData });
  assert.equal(available.syncStatus, "available");
  assert.equal(available.notion, dashboardData);
  assert.equal(available.retrying, false);

  const refreshing = dashboardReducer(available, { type: "start", requestId: 2, kind: "refresh" });
  const unavailable = dashboardReducer(refreshing, { type: "failure", requestId: 2 });
  assert.equal(unavailable.syncStatus, "unavailable");
  assert.equal(unavailable.notion, null);
  assert.equal(shouldShowRetryAction(unavailable), true);

  const retrying = dashboardReducer(unavailable, { type: "start", requestId: 3, kind: "retry" });
  assert.equal(retrying.syncStatus, "loading");
  assert.equal(retrying.retrying, true);
  assert.equal(shouldShowRetryAction(retrying), true);

  const retried = dashboardReducer(retrying, { type: "success", requestId: 3, data: dashboardData });
  assert.equal(retried.syncStatus, "available");
  assert.equal(retried.retrying, false);
  assert.equal(shouldShowRetryAction(retried), false);

  const secondRetry = dashboardReducer(unavailable, { type: "start", requestId: 4, kind: "retry" });
  const retryFailed = dashboardReducer(secondRetry, { type: "failure", requestId: 4 });
  assert.equal(retryFailed.syncStatus, "unavailable");
  assert.equal(retryFailed.notion, null);
  assert.equal(shouldShowRetryAction(retryFailed), true);
});

test("ignores responses from older dashboard requests", () => {
  const first = dashboardReducer(initialDashboardState, { type: "start", requestId: 1, kind: "initial" });
  const second = dashboardReducer(first, { type: "start", requestId: 2, kind: "refresh" });
  const newestData = { ...dashboardData, xp: 250 };
  const newestSuccess = dashboardReducer(second, { type: "success", requestId: 2, data: newestData });

  const afterOldFailure = dashboardReducer(newestSuccess, { type: "failure", requestId: 1 });
  const afterOldSuccess = dashboardReducer(afterOldFailure, { type: "success", requestId: 1, data: dashboardData });
  assert.equal(afterOldFailure, newestSuccess);
  assert.equal(afterOldSuccess, newestSuccess);
  assert.equal(afterOldSuccess.notion?.xp, 250);

  const latestFailure = dashboardReducer(second, { type: "failure", requestId: 2 });
  const staleSuccess = dashboardReducer(latestFailure, { type: "success", requestId: 1, data: dashboardData });
  assert.equal(staleSuccess, latestFailure);
  assert.equal(staleSuccess.syncStatus, "unavailable");
  assert.equal(staleSuccess.notion, null);
});

test("accepts only usable exercise lists", () => {
  assert.deepEqual(
    getValidExercises([
      [" Supino ", " 30 kg ", " Peito "],
      ["Flying", "9,5 kg", "Peito"],
      ["Rosca", "9.5 kg", "Bíceps"],
      ["Abdominal", "Peso corporal", "Abdômen"],
    ]),
    [
      { name: "Supino", loadKind: "weight", loadLabel: "30 kg", loadKg: 30, group: "Peito" },
      { name: "Flying", loadKind: "weight", loadLabel: "9,5 kg", loadKg: 9.5, group: "Peito" },
      { name: "Rosca", loadKind: "weight", loadLabel: "9.5 kg", loadKg: 9.5, group: "Bíceps" },
      {
        name: "Abdominal",
        loadKind: "bodyweight",
        loadLabel: "Peso corporal",
        loadKg: 0,
        group: "Abdômen",
      },
    ],
  );

  assert.deepEqual(parseSupportedLoad("30kg"), { kind: "weight", label: "30 kg", kg: 30 });
  assert.deepEqual(parseSupportedLoad("0 kg"), { kind: "weight", label: "0 kg", kg: 0 });

  const invalidLists = [
    null,
    "not-an-array",
    {},
    [],
    [null],
    [[]],
    [["", "", ""]],
    [["Supino"]],
    [["Supino", 30, "Peito"]],
    [["Supino", "30 kg", "Peito", "extra"]],
    [["Supino", "30 kg", "Peito"], [" supino ", "35 kg", "Peito"]],
    [["Supino", "", "Peito"]],
    [["Supino", "   ", "Peito"]],
    [["Supino", "banana", "Peito"]],
    [["Supino", "30 bananas", "Peito"]],
    [["Supino", "30kg extra", "Peito"]],
    [["Supino", "30", "Peito"]],
    [["Supino", "-5 kg", "Peito"]],
    [["Supino", "NaN kg", "Peito"]],
    [["Supino", "Infinity kg", "Peito"]],
    [["Supino", "9.25 kg", "Peito"]],
  ];

  for (const value of invalidLists) {
    assert.deepEqual(getValidExercises(value), []);
  }

  for (const load of ["", "   ", "banana", "30 bananas", "30kg extra", "30", "-5 kg", "NaN kg", "Infinity kg", "9.25 kg"]) {
    assert.equal(parseSupportedLoad(load), null);
  }
});

test("blocks erased or invalid form loads and keeps bodyweight distinct from zero kilograms", () => {
  const exercises = getValidExercises([
    ["Supino", "30 kg", "Peito"],
    ["Abdominal", "Peso corporal", "Abdômen"],
    ["Máquina sem carga", "0 kg", "Outro"],
  ]);
  const items = createTrainingFormItems(exercises);

  assert.equal(items[0].loadInput, "30");
  assert.deepEqual(
    { loadKind: items[1].loadKind, loadInput: items[1].loadInput },
    { loadKind: "bodyweight", loadInput: "" },
  );
  assert.deepEqual(
    { loadKind: items[2].loadKind, loadInput: items[2].loadInput },
    { loadKind: "weight", loadInput: "0" },
  );
  assert.equal(isTrainingFormValid(items), true);

  const erased = updateTrainingFormLoad(items, 0, "");
  assert.equal(erased[0].loadInput, "");
  assert.equal(parseEditableLoad(erased[0].loadInput), null);
  assert.equal(isTrainingFormValid(erased), false);
  assert.equal(buildTrainingExercisePayload(erased), null);

  const invalid = updateTrainingFormLoad(items, 0, "texto arbitrário");
  assert.equal(invalid[0].loadInput, "texto arbitrário");
  assert.equal(parseEditableLoad(invalid[0].loadInput), null);
  assert.equal(isTrainingFormValid(invalid), false);
  assert.equal(buildTrainingExercisePayload(invalid), null);

  const valid = updateTrainingFormLoad(items, 0, "30.5");
  assert.equal(isTrainingFormValid(valid), true);
  assert.deepEqual(buildTrainingExercisePayload(valid), [
    { name: "Supino", load: 30.5, completed: true, increase: false },
    { name: "Abdominal", load: 0, completed: true, increase: false },
    { name: "Máquina sem carga", load: 0, completed: true, increase: false },
  ]);

  const bodyweightEditAttempt = updateTrainingFormLoad(items, 1, "50");
  assert.deepEqual(bodyweightEditAttempt[1], items[1]);
});
