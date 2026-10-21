-- pg_trgm backs cards_slug_trgm_idx and the similarity() lookup for
-- non-canonical card URLs. Drizzle has no notion of extensions, so it is
-- created here, ahead of the index that needs it.
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TABLE "cards" (
	"oracle_id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"lookup_key" text NOT NULL,
	"id" text NOT NULL,
	"cost" text NOT NULL,
	"cmc" real NOT NULL,
	"type" text NOT NULL,
	"oracle" text NOT NULL,
	"color_identity" text[] NOT NULL,
	"keywords" text[] NOT NULL,
	"set_code" text NOT NULL,
	"set_name" text NOT NULL,
	"rarity" text NOT NULL,
	"collector_number" text NOT NULL,
	"released_at" text NOT NULL,
	"layout" text NOT NULL,
	"uri" text NOT NULL,
	"image" text,
	"rank" integer,
	"legal" text NOT NULL,
	"commander_legal" boolean NOT NULL,
	"content_hash" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "cards_slug_idx" ON "cards" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "cards_name_idx" ON "cards" USING btree ("name");--> statement-breakpoint
CREATE INDEX "cards_lookup_key_idx" ON "cards" USING btree ("lookup_key");--> statement-breakpoint
CREATE INDEX "cards_slug_trgm_idx" ON "cards" USING gin ("slug" gin_trgm_ops);