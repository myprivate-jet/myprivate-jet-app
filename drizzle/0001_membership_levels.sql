ALTER TABLE "bookings" ADD COLUMN "estimate" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "price_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "tier" text DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "assured_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "assured_since" timestamp with time zone;--> statement-breakpoint
UPDATE "bookings" SET "price_accepted_at" = "created_at" WHERE "price" IS NOT NULL;
