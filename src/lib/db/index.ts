/**
 * Database client.
 *
 * Resolved lazily on first use rather than at import time: most of the site —
 * card pages, search, ratings, the local builder — works with no database at
 * all, and it should keep building and running when DATABASE_URL is absent.
 * Only the routes that actually persist a pairing fail, and they say why.
 *
 * Neon's HTTP driver has no interactive transactions, so every write in
 * `teams.ts` is a single statement or a `db.batch` — never a read-then-write
 * split across round trips.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "DATABASE_URL is not set. Copy .env.example to .env.local and paste your Neon connection string.",
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

let cached: NeonHttpDatabase<typeof schema> | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (cached) return cached;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new DatabaseNotConfiguredError();

  cached = drizzle(neon(connectionString), { schema });
  return cached;
}

export { schema };
