ALTER TABLE "users" ADD COLUMN "google_id" varchar(255);--> statement-breakpoint
CREATE UNIQUE INDEX "users_google_id_idx" ON "users" USING btree ("google_id");