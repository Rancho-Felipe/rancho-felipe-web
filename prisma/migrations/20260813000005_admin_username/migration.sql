-- The owner signs in with a username rather than an email address.
--
-- Added in three steps rather than one, because an existing admin row would
-- fail a straight NOT NULL add. Backfilled from the local part of the email so
-- nobody is locked out of an account that already exists.

ALTER TABLE "admin_user" ADD COLUMN "username" TEXT;

UPDATE "admin_user"
   SET "username" = split_part("email", '@', 1)
 WHERE "username" IS NULL;

ALTER TABLE "admin_user" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "admin_user_username_key" ON "admin_user"("username");
