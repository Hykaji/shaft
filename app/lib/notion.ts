export const NOTION_VERSION = "2026-03-11";

export const SOURCES = {
  activities: "e389f37d-3d89-4075-ac23-6bb73e88733a",
  checkins: "444fc733-37d0-4d0f-9653-f3a67c7a0f9e",
  weeks: "0fd446ae-8b88-402b-a106-c7f429104a5e",
  finances: "dcdf3402-8e1b-409b-8da8-569a07411bf0",
  exercises: "060b27fb-e25e-4dbd-9597-ec6968264bd6",
  sessions: "9fba940c-2c4b-4cf3-a035-c6520ce59518",
  loads: "c74c1230-0b78-4856-81b5-7da089455f39",
} as const;

export type NotionProperty = Record<string, unknown>;
export type NotionPage = { id: string; properties: Record<string, NotionProperty> };

export class NotionApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function notionRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = process.env.NOTION_API_KEY?.trim();
  if (!token) throw new NotionApiError(503, "Integração do Notion ainda não autorizada.");

  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (response.status === 429 && retry) {
    const seconds = Math.min(Number(response.headers.get("Retry-After") ?? 1), 3);
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    return notionRequest<T>(path, init, false);
  }
  if (!response.ok) {
    const detail = await response.json().catch(() => null) as { message?: string } | null;
    throw new NotionApiError(response.status, detail?.message ?? `Notion respondeu ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

export function query(source: string, body: Record<string, unknown>) {
  return notionRequest<{ results: NotionPage[]; has_more: boolean }>(`/data_sources/${source}/query`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function createPage(source: string, properties: Record<string, unknown>) {
  return notionRequest<NotionPage>("/pages", {
    method: "POST",
    body: JSON.stringify({ parent: { data_source_id: source }, properties }),
  });
}

export function updatePage(pageId: string, properties: Record<string, unknown>) {
  return notionRequest<NotionPage>(`/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties }),
  });
}

export const property = {
  title: (content: string) => ({ title: [{ type: "text", text: { content } }] }),
  text: (content: string) => ({ rich_text: content ? [{ type: "text", text: { content } }] : [] }),
  number: (value: number | null) => ({ number: value }),
  select: (name: string | null) => ({ select: name ? { name } : null }),
  date: (start: string) => ({ date: { start } }),
  checkbox: (value: boolean) => ({ checkbox: value }),
};

export function getTitle(page: NotionPage, name: string) {
  const value = page.properties[name]?.title as Array<{ plain_text?: string }> | undefined;
  return value?.map((item) => item.plain_text ?? "").join("") ?? "";
}
export function getText(page: NotionPage, name: string) {
  const value = page.properties[name]?.rich_text as Array<{ plain_text?: string }> | undefined;
  return value?.map((item) => item.plain_text ?? "").join("") ?? "";
}
export function getNumber(page: NotionPage, name: string) {
  return (page.properties[name]?.number as number | null) ?? 0;
}
export function getSelect(page: NotionPage, name: string) {
  return ((page.properties[name]?.select as { name?: string } | null)?.name) ?? "";
}
export function getCheckbox(page: NotionPage, name: string) {
  return Boolean(page.properties[name]?.checkbox);
}
export function getRelation(page: NotionPage, name: string) {
  return ((page.properties[name]?.relation as Array<{ id: string }> | undefined) ?? []).map((item) => item.id);
}

export function apiError(error: unknown) {
  if (error instanceof NotionApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return Response.json({ error: error instanceof Error ? error.message : "Falha inesperada." }, { status: 500 });
}
