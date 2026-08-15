import assert from "node:assert/strict";
import test, { afterEach, beforeEach } from "node:test";
import {
  NotionApiError,
  query,
  queryAllPages,
  SOURCES,
} from "../app/lib/notion.ts";

const originalFetch = globalThis.fetch;
const originalNotionToken = process.env.NOTION_API_KEY;
const originalAllowedUserIds = process.env.SHAFT_ALLOWED_USER_IDS;
const originalAllowedUserEmails = process.env.SHAFT_ALLOWED_USER_EMAILS;

beforeEach(() => {
  process.env.NOTION_API_KEY = "test-notion-token";
  process.env.SHAFT_ALLOWED_USER_IDS = "user-owner";
  delete process.env.SHAFT_ALLOWED_USER_EMAILS;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  restoreEnvironment("NOTION_API_KEY", originalNotionToken);
  restoreEnvironment("SHAFT_ALLOWED_USER_IDS", originalAllowedUserIds);
  restoreEnvironment("SHAFT_ALLOWED_USER_EMAILS", originalAllowedUserEmails);
});

function restoreEnvironment(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function listResponse(results, hasMore = false, nextCursor = null, requestStatus) {
  const payload = {
    object: "list",
    type: "page_or_data_source",
    page_or_data_source: {},
    results,
    has_more: hasMore,
    next_cursor: nextCursor,
  };
  if (requestStatus !== undefined) payload.request_status = requestStatus;
  return Response.json(payload);
}

function page(id) {
  return { id, properties: {} };
}

function financePage(id, kind, value, planned = false) {
  return {
    id,
    properties: {
      Planejado: { checkbox: planned },
      Valor: { number: value },
      Tipo: { select: { name: kind } },
    },
  };
}

function parseNotionCall(input, init) {
  const url = new URL(typeof input === "string" ? input : input.url);
  const segments = url.pathname.split("/");
  return {
    source: segments.at(-2),
    body: JSON.parse(String(init?.body ?? "{}")),
  };
}

async function loadWorker(label) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("finance-pagination-test", `${label}-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

function workerBindings() {
  return {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  };
}

function workerContext() {
  return {
    waitUntil() {},
    passThroughOnException() {},
  };
}

function ownerRequest() {
  return new Request("https://shaft.example/api/notion/dashboard", {
    headers: {
      "oai-authenticated-user-id": "user-owner",
      "oai-authenticated-user-email": "owner@example.com",
    },
  });
}

test("keeps query as a single-page request and exposes next_cursor", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return listResponse([page("first")], true, "next-page");
  };

  const response = await query("source-single", { page_size: 1 });

  assert.equal(calls, 1);
  assert.deepEqual(response.results, [page("first")]);
  assert.equal(response.has_more, true);
  assert.equal(response.next_cursor, "next-page");
});

test("preserves the original query body while following a short page", async () => {
  const body = {
    page_size: 25,
    start_cursor: "initial-cursor",
    filter: { property: "Status", select: { equals: "Ativa" } },
    sorts: [{ property: "Ordem", direction: "ascending" }],
    result_type: "page",
  };
  const originalBody = structuredClone(body);
  const requestBodies = [];

  globalThis.fetch = async (input, init) => {
    const call = parseNotionCall(input, init);
    requestBodies.push(call.body);
    if (requestBodies.length === 1) {
      return listResponse([page("one")], true, "second-cursor");
    }
    return listResponse([page("two")]);
  };

  const results = await queryAllPages("source-all", body, 2);

  assert.deepEqual(results, [page("one"), page("two")]);
  assert.deepEqual(body, originalBody);
  assert.deepEqual(requestBodies, [
    originalBody,
    { ...originalBody, start_cursor: "second-cursor" },
  ]);
});

test("rejects absent or empty next cursors without requesting another page", async (t) => {
  for (const nextCursor of [null, "", "   "]) {
    await t.test(`next_cursor=${JSON.stringify(nextCursor)}`, async () => {
      let calls = 0;
      globalThis.fetch = async () => {
        calls += 1;
        return listResponse([page("partial")], true, nextCursor);
      };

      await assert.rejects(
        queryAllPages("source-invalid-cursor", { page_size: 100 }, 2),
        (error) => error instanceof NotionApiError && error.status === 502,
      );
      assert.equal(calls, 1);
    });
  }
});

test("rejects a repeated cursor before making a third request", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) return listResponse([page("one")], true, "repeated");
    return listResponse([page("two")], true, "repeated");
  };

  await assert.rejects(
    queryAllPages("source-repeated", { page_size: 100 }, 3),
    (error) => error instanceof NotionApiError && error.status === 502,
  );
  assert.equal(calls, 2);
});

test("fails when the explicit page limit is reached and rejects limits above 100", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return listResponse([page("partial")], true, "next");
  };

  await assert.rejects(
    queryAllPages("source-limited", { page_size: 100 }, 1),
    (error) => error instanceof NotionApiError && error.status === 502,
  );
  assert.equal(calls, 1);

  await assert.rejects(
    queryAllPages("source-invalid-limit", { page_size: 100 }, 101),
    (error) => error instanceof NotionApiError && error.status === 500,
  );
  assert.equal(calls, 1);
});

test("rejects a Notion response explicitly marked as incomplete", async () => {
  globalThis.fetch = async () => listResponse(
    [page("truncated")],
    false,
    null,
    { type: "incomplete", incomplete_reason: "query_result_limit_reached" },
  );

  await assert.rejects(
    queryAllPages("source-incomplete", { page_size: 100 }, 100),
    (error) => error instanceof NotionApiError
      && error.status === 502
      && error.message === "Não foi possível carregar todos os resultados do Notion."
      && !error.message.includes("query_result_limit_reached"),
  );
});

test("includes more than 100 finance movements in the dashboard balance", async () => {
  const financeBodies = [];
  const firstPage = Array.from({ length: 100 }, (_, index) =>
    financePage(`entry-${index}`, "Entrada", 1),
  );
  const secondPage = Array.from({ length: 25 }, (_, index) =>
    financePage(`exit-${index}`, "Saída", 1),
  );

  globalThis.fetch = async (input, init) => {
    const call = parseNotionCall(input, init);
    if (call.source !== SOURCES.finances) return listResponse([]);

    financeBodies.push(call.body);
    if (call.body.start_cursor === undefined) {
      return listResponse(firstPage, true, "finance-page-2");
    }
    assert.equal(call.body.start_cursor, "finance-page-2");
    return listResponse(secondPage);
  };

  const worker = await loadWorker("more-than-100");
  const response = await worker.fetch(ownerRequest(), workerBindings(), workerContext());
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.match(payload.balance, /^R\$\s*75,00$/);
  assert.deepEqual(financeBodies, [
    { page_size: 100 },
    { page_size: 100, start_cursor: "finance-page-2" },
  ]);
});

test("keeps the existing finance balance rules unchanged", async () => {
  const movements = [
    financePage("entry", "Entrada", 10),
    financePage("initial", "Saldo inicial", 5),
    financePage("exit", "Saída", 3),
    financePage("saving", "Economia", 2),
    financePage("transfer", "Transferência", 100),
    financePage("planned", "Entrada", 50, true),
  ];

  globalThis.fetch = async (input, init) => {
    const call = parseNotionCall(input, init);
    return call.source === SOURCES.finances
      ? listResponse(movements)
      : listResponse([]);
  };

  const worker = await loadWorker("balance-rules");
  const response = await worker.fetch(ownerRequest(), workerBindings(), workerContext());
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.match(payload.balance, /^R\$\s*10,00$/);
});

test("does not return a partial balance when a later finance page fails", async () => {
  const cursorSentinel = "CURSOR-SENTINEL-DO-NOT-EXPOSE";
  const internalSentinels = [
    cursorSentinel,
    "SHARD-SENTINEL-finance-7",
    "TIMESTAMP-SENTINEL-2026-08-15T12:34:56Z",
    "SESSION-SENTINEL-private-session",
  ];
  let financeCalls = 0;
  globalThis.fetch = async (input, init) => {
    const call = parseNotionCall(input, init);
    if (call.source !== SOURCES.finances) return listResponse([]);

    financeCalls += 1;
    if (financeCalls === 1) {
      return listResponse(
        Array.from({ length: 100 }, (_, index) =>
          financePage(`partial-${index}`, "Entrada", 1),
        ),
        true,
        cursorSentinel,
      );
    }
    return Response.json({
      message: `Remote failure for ${internalSentinels.join(" | ")}`,
    }, { status: 503 });
  };

  const worker = await loadWorker("later-failure");
  const response = await worker.fetch(ownerRequest(), workerBindings(), workerContext());
  const payload = await response.json();

  assert.equal(financeCalls, 2);
  assert.equal(response.status, 503);
  assert.deepEqual(payload, { error: "Não foi possível carregar todos os resultados do Notion." });
  for (const sentinel of internalSentinels) {
    assert.equal(JSON.stringify(payload).includes(sentinel), false);
  }
  assert.equal("balance" in payload, false);
});

test("rejects 10,000 finance records marked incomplete without returning a balance", async () => {
  const incompleteReason = "query_result_limit_reached";
  let financeCalls = 0;

  globalThis.fetch = async (input, init) => {
    const call = parseNotionCall(input, init);
    if (call.source !== SOURCES.finances) return listResponse([]);

    financeCalls += 1;
    const isLastPage = financeCalls === 100;
    const results = Array.from({ length: 100 }, (_, index) =>
      financePage(`record-${financeCalls}-${index}`, "Entrada", 1),
    );
    return listResponse(
      results,
      !isLastPage,
      isLastPage ? null : `finance-cursor-${financeCalls + 1}`,
      isLastPage ? { type: "incomplete", incomplete_reason: incompleteReason } : undefined,
    );
  };

  const worker = await loadWorker("incomplete-10000");
  const response = await worker.fetch(ownerRequest(), workerBindings(), workerContext());
  const payload = await response.json();

  assert.equal(financeCalls, 100);
  assert.equal(response.status, 502);
  assert.deepEqual(payload, { error: "Não foi possível carregar todos os resultados do Notion." });
  assert.equal(JSON.stringify(payload).includes(incompleteReason), false);
  assert.equal("balance" in payload, false);
});

test("preserves the Mission 3 guard before every Notion request", async () => {
  let notionCalls = 0;
  globalThis.fetch = async () => {
    notionCalls += 1;
    throw new Error("An unauthorized request must not reach Notion.");
  };

  const worker = await loadWorker("authorization-guard");
  const response = await worker.fetch(
    new Request("https://shaft.example/api/notion/dashboard"),
    workerBindings(),
    workerContext(),
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Autenticação necessária." });
  assert.equal(notionCalls, 0);
});
