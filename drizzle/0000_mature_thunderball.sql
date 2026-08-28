CREATE TYPE "public"."deck_slot" AS ENUM('a', 'b');--> statement-breakpoint
CREATE TYPE "public"."format" AS ENUM('commander', 'constructed');--> statement-breakpoint
CREATE TABLE "deck_cards" (
	"deck_id" uuid NOT NULL,
	"card_name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "deck_cards_deck_id_card_name_pk" PRIMARY KEY("deck_id","card_name")
);
--> statement-breakpoint
CREATE TABLE "decks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"slot" "deck_slot" NOT NULL,
	"name" text NOT NULL,
	"commanders" text[] DEFAULT ARRAY[]::text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"format" "format" DEFAULT 'commander' NOT NULL,
	"owner_id" text,
	"edit_token" text NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decks" ADD CONSTRAINT "decks_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deck_cards_card_name_idx" ON "deck_cards" USING btree ("card_name");--> statement-breakpoint
CREATE UNIQUE INDEX "decks_team_slot_idx" ON "decks" USING btree ("team_id","slot");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_slug_idx" ON "teams" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "teams_owner_idx" ON "teams" USING btree ("owner_id");