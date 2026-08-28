CREATE TYPE "public"."entry_kind" AS ENUM('pairing', 'solo');--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "kind" "entry_kind" DEFAULT 'pairing' NOT NULL;