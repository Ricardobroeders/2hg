import { defineConfig } from "drizzle-kit";

// Next.js reads .env.local on its own; drizzle-kit does not, so load it here.
// Node's built-in loader — no dotenv dependency, and it no-ops in CI where the
// connection string comes from the environment instead of a file.
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local (CI, or a fresh clone) — fall through to process.env.
}

/**
 * Migrations are files in the repo, generated with `npm run db:generate` and
 * applied with `npm run db:migrate`. Schema changes are never hand-applied to
 * a database — preview branches and production need a reproducible history.
 */
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
