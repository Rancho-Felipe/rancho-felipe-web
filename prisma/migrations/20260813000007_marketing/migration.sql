-- CreateEnum
CREATE TYPE "social_platform" AS ENUM ('FACEBOOK_PAGE', 'FACEBOOK_PROFILE', 'TIKTOK', 'INSTAGRAM', 'MESSENGER');

-- CreateEnum
CREATE TYPE "post_status" AS ENUM ('DRAFT', 'SCHEDULED', 'POSTED');

-- CreateTable
CREATE TABLE "social_account" (
    "id" TEXT NOT NULL,
    "platform" "social_platform" NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "inbox_url" TEXT,
    "handle" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "social_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "photo_slugs" TEXT[],
    "platforms" "social_platform"[],
    "status" "post_status" NOT NULL DEFAULT 'DRAFT',
    "scheduled_for" TIMESTAMPTZ(3),
    "posted_at" TIMESTAMPTZ(3),
    "post_url" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "marketing_post_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "social_account_platform_url_key" ON "social_account"("platform", "url");

-- CreateIndex
CREATE INDEX "marketing_post_status_scheduled_for_idx" ON "marketing_post"("status", "scheduled_for");
