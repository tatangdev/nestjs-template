ALTER TABLE "users" ADD COLUMN "facebook_id" varchar(255);--> statement-breakpoint
CREATE UNIQUE INDEX "users_facebook_id_idx" ON "users" USING btree ("facebook_id");