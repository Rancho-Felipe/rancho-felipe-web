-- The double-booking guard.
--
-- Prisma cannot express an exclusion constraint, so it lives here. This is the
-- single most important object in the database: without it, two guests hitting
-- "Hold this date" at the same instant would both succeed, and the resort would
-- find out on the day.
--
-- Application code must never be the only thing standing between a guest and a
-- double booking. The check runs inside Postgres, so it holds regardless of how
-- many server instances Vercel happens to be running.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Sanity: a booking must occupy real, forward-moving time.
ALTER TABLE "booking"
  ADD CONSTRAINT "booking_time_is_forward"
  CHECK ("check_in_at" < "check_out_at");

ALTER TABLE "booking"
  ADD CONSTRAINT "booking_hold_is_forward"
  CHECK ("held_from" < "held_until");

-- The hold window must contain the stay it is protecting. held_from/held_until
-- are check-in/check-out widened by the turnover buffer, so this catches any
-- code path that computes them wrongly.
ALTER TABLE "booking"
  ADD CONSTRAINT "booking_hold_wraps_stay"
  CHECK ("held_from" <= "check_in_at" AND "held_until" >= "check_out_at");

-- The guard itself.
--
-- Two bookings collide when they are on the SAME unit and their held windows
-- overlap. The units are deliberately independent: the Casita and the Gazebo
-- keep separate calendars, so unit_id being part of the key is what lets two
-- groups be on the farm at once.
--
-- '[)' — half-open — is what makes the resort's three windows work without any
-- special-casing. A night tour ending 06:00 and a day tour starting 07:00 do
-- not overlap. A full stay running to 12:00 and a day tour starting 07:00 that
-- morning do, and the second one is refused.
--
-- Only live bookings reserve time. Expired, cancelled and rejected rows stay in
-- the table for the owner's records but stop holding the date. Rows imported
-- from Airbnb are excluded because those live in calendar_block, where two
-- sources are allowed to cover the same dates.
-- Note: the two-argument tstzrange() is used deliberately. Its default bounds
-- are already '[)', and unlike the three-argument form it is IMMUTABLE, which
-- Postgres requires for an index expression.
ALTER TABLE "booking"
  ADD CONSTRAINT "booking_no_overlap"
  EXCLUDE USING gist (
    "unit_id" WITH =,
    tstzrange("held_from", "held_until") WITH &&
  )
  WHERE (
    "source" <> 'AIRBNB_ICAL'
    AND "status" IN ('PENDING', 'AWAITING_VERIFICATION', 'CONFIRMED')
  );

-- Availability reads scan blocks by unit and time; this is the supporting index.
CREATE INDEX "calendar_block_window_idx"
  ON "calendar_block" USING gist (
    "unit_id",
    tstzrange("start_at", "end_at")
  );
