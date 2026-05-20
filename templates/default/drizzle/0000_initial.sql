CREATE TABLE IF NOT EXISTS "learners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" text NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "learners_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "progress_entries" (
	"learner_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"scope" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "progress_entries_pkey" PRIMARY KEY("learner_id","kind","scope","key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transfer_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"learner_id" uuid NOT NULL,
	"expires_at" timestamptz NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "progress_entries" ADD CONSTRAINT "progress_entries_learner_id_learners_id_fk"
		FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "transfer_codes" ADD CONSTRAINT "transfer_codes_learner_id_learners_id_fk"
		FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "progress_by_learner" ON "progress_entries" ("learner_id","scope");
