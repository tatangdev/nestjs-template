ALTER TABLE "users" ADD COLUMN "apple_id" varchar(255);--> statement-breakpoint
CREATE UNIQUE INDEX "users_apple_id_idx" ON "users" USING btree ("apple_id");