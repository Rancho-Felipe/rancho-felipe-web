-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "package_key" AS ENUM ('DAY_TOUR', 'NIGHT_TOUR', 'FULL_STAY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('PENDING', 'AWAITING_VERIFICATION', 'CONFIRMED', 'EXPIRED', 'CANCELLED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "booking_source" AS ENUM ('DIRECT', 'MANUAL', 'AIRBNB_ICAL');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('GCASH', 'MAYA', 'BPI', 'PAYMONGO', 'CASH');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "block_source" AS ENUM ('MANUAL', 'AIRBNB_ICAL');

-- CreateTable
CREATE TABLE "unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "maxGuests" INTEGER NOT NULL,
    "includedGuests" INTEGER NOT NULL,
    "extensionRate" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "airbnbUrl" TEXT,
    "icalImportUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_plan" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "package" "package_key" NOT NULL,
    "minPax" INTEGER NOT NULL DEFAULT 1,
    "maxPax" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "rate_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasonal_rate" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit_id" TEXT,
    "package" "package_key",
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "price_override" INTEGER,
    "percent_adjust" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seasonal_rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "package" "package_key" NOT NULL,
    "check_in_at" TIMESTAMPTZ(3) NOT NULL,
    "check_out_at" TIMESTAMPTZ(3) NOT NULL,
    "held_from" TIMESTAMPTZ(3) NOT NULL,
    "held_until" TIMESTAMPTZ(3) NOT NULL,
    "status" "booking_status" NOT NULL DEFAULT 'PENDING',
    "source" "booking_source" NOT NULL DEFAULT 'DIRECT',
    "guest_name" TEXT NOT NULL,
    "guest_email" TEXT NOT NULL,
    "guest_phone" TEXT NOT NULL,
    "guest_address" TEXT NOT NULL,
    "pax_total" INTEGER NOT NULL,
    "pax_under_4" INTEGER NOT NULL DEFAULT 0,
    "pets" INTEGER NOT NULL DEFAULT 0,
    "extension_hours" INTEGER NOT NULL DEFAULT 0,
    "guest_note" TEXT,
    "internal_note" TEXT,
    "subtotal" INTEGER NOT NULL,
    "extras_total" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "deposit_due" INTEGER NOT NULL,
    "balance_due" INTEGER NOT NULL,
    "breakdown" JSONB NOT NULL,
    "hold_expires_at" TIMESTAMPTZ(3),
    "confirmed_at" TIMESTAMPTZ(3),
    "cancelled_at" TIMESTAMPTZ(3),
    "external_uid" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "add_on" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "price" INTEGER NOT NULL,
    "packages" "package_key"[],
    "unit_ids" TEXT[],
    "pay_on_site" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "add_on_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_add_on" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "add_on_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,

    CONSTRAINT "booking_add_on_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "method" "payment_method" NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "reference" TEXT,
    "proof_path" TEXT,
    "provider_id" TEXT,
    "verified_at" TIMESTAMPTZ(3),
    "verified_by_id" TEXT,
    "rejected_note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_block" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "start_at" TIMESTAMPTZ(3) NOT NULL,
    "end_at" TIMESTAMPTZ(3) NOT NULL,
    "source" "block_source" NOT NULL DEFAULT 'MANUAL',
    "reason" TEXT,
    "external_uid" TEXT,
    "feed_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ical_feed" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_fetched_at" TIMESTAMPTZ(3),
    "last_ok_at" TIMESTAMPTZ(3),
    "last_error" TEXT,
    "failure_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ical_feed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "admin_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_name" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review" (
    "id" TEXT NOT NULL,
    "author" TEXT,
    "rating" INTEGER NOT NULL,
    "date_label" TEXT,
    "text" TEXT NOT NULL,
    "image_slug" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_block" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "content_block_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "rate_plan_unit_id_package_maxPax_key" ON "rate_plan"("unit_id", "package", "maxPax");

-- CreateIndex
CREATE UNIQUE INDEX "booking_reference_key" ON "booking"("reference");

-- CreateIndex
CREATE INDEX "booking_unit_id_held_from_held_until_idx" ON "booking"("unit_id", "held_from", "held_until");

-- CreateIndex
CREATE INDEX "booking_status_hold_expires_at_idx" ON "booking"("status", "hold_expires_at");

-- CreateIndex
CREATE INDEX "booking_check_in_at_idx" ON "booking"("check_in_at");

-- CreateIndex
CREATE UNIQUE INDEX "booking_add_on_booking_id_add_on_id_key" ON "booking_add_on"("booking_id", "add_on_id");

-- CreateIndex
CREATE INDEX "payment_booking_id_idx" ON "payment"("booking_id");

-- CreateIndex
CREATE INDEX "calendar_block_unit_id_start_at_end_at_idx" ON "calendar_block"("unit_id", "start_at", "end_at");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_block_feed_id_external_uid_key" ON "calendar_block"("feed_id", "external_uid");

-- CreateIndex
CREATE UNIQUE INDEX "ical_feed_unit_id_key" ON "ical_feed"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_user_email_key" ON "admin_user"("email");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- AddForeignKey
ALTER TABLE "rate_plan" ADD CONSTRAINT "rate_plan_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_add_on" ADD CONSTRAINT "booking_add_on_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_add_on" ADD CONSTRAINT "booking_add_on_add_on_id_fkey" FOREIGN KEY ("add_on_id") REFERENCES "add_on"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_block" ADD CONSTRAINT "calendar_block_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
