import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export class D1BindingUnavailableError extends Error {
  constructor() {
    super("Cloudflare D1 binding `DB` is unavailable.");
  }
}

export async function getD1Binding(): Promise<D1Database> {
  const { env } = await import("cloudflare:workers");
  if (!env.DB) throw new D1BindingUnavailableError();
  return env.DB;
}

export async function getDb() {
  return drizzle(await getD1Binding(), { schema });
}
