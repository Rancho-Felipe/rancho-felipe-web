-- CreateTable
CREATE TABLE "booking_counter" (
    "unit_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "booking_counter_pkey" PRIMARY KEY ("unit_id","year")
);
