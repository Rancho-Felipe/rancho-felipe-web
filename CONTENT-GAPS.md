# Content gaps — Rancho Felipe

Everything in `content/manifest.json` came out of your folders. This file tracks what the
folders **don't** contain. Answers you've given are recorded in `content/policy.json`.

**Status: 8 of 13 resolved. 5 open, none of them blocking the build.**

---

## Resolved — 2026-08-12

| # | Question | Answer |
|---|---|---|
| Q1 | One calendar or two? | **Two.** Separate calendars per unit, same three check-in windows for both. A group in the Casita does not block the Gazebo. |
| Q2 | Site map source art | **Draw it.** SVG traced from the drone shot and the photos. |
| Q3 | Weekend / holiday rates | **None today.** Admin tab built and left empty so they can be added later. |
| Q5 | Corkage, security deposit | **Neither.** No corkage, no security deposit, no other charges. |
| Q7 | Deposit | **30%** of the total. Non-cancellable once paid, but the date can be moved. |
| — | Extra guests | 3 and under free. ₱300 each from age 4, above the band's included count. |
| — | Extensions | ₱500/hr Casita, ₱300/hr Gazebo. Only when nobody is booked after them. |
| — | Pets | Up to 3 free, more than 3 chargeable at ₱400, never in the pool. |
| — | LPG | ₱250 for a day or night tour, ₱500 for the 22-hour stay. |
| — | Bonfire | Free to use. ₱250 to the caretaker for firewood. |
| — | Security | Gated, CCTV throughout, caretakers on site. |
| — | Damages | Guest pays. |

---

## Open — please confirm

### O1 — "Videoke till 2pm" — did you mean 2 AM?

Taken literally, a 2:00 **PM** curfew bans videoke for the entire night tour (20:00–06:00),
and your own Facebook post advertises **24/7 karaoke**. I've built it as an editable setting
**defaulting to 2:00 AM**. One word from you and it's fixed either way.

### O2 — Is the extension fee per hour?

₱500 Casita / ₱300 Gazebo. I've read these as **per hour**. If it's a flat fee per extension,
say so — it changes the checkout maths.

### O3 — More than 3 pets: ₱400 flat, or ₱400 each?

Built as a **flat surcharge** for going over 3. Confirm.

### O4 — Turnover between bookings

Because bookings are stored as real timestamps, a night tour ending 06:00 and a day tour
starting 07:00 don't collide on their own — the system would happily sell both. I've added a
**60-minute cleaning buffer** on top, which still allows that pair.

- Is one hour enough for the caretakers to reset a unit?
- Same-day cutoff: how late can someone book online for tonight? Default is **6 hours before check-in**.

### O5 — Small facts nothing in the folders answers

- **Email address** — needed to send the receipts you asked for and to receive booking alerts. Without one, confirmation emails cannot go out. **This is the only item that blocks a launch.**
- **GPS coordinates** — for the map pin and the `LodgingBusiness` schema. Open your Maps pin and send the numbers, or tell me I may fetch them from the short link.
- **Gazebo: 11–15 pax.** Your card prices 10-and-below and 16. Does the ₱300 extra-guest fee bridge the gap, or is there a middle price?
- **Review years** — the six real reviews say "Oct 27", "Sept 27", "July 12–15" with no year.
- **Vehicles** — how many cars fit inside the gate?
- **Smoking** — indoors banned? I've drafted it that way.

### O6 — House rules I drafted for you

You asked me to write more. Ten are drafted in `content/policy.json` under `houseRules.$drafted`
— exclusive use, pool supervision, no glass poolside, pets, no corkage, smoking, bonfire safety,
parking, checkout, and noise. Four are marked `$confirm` because they're genuine guesses.
Read them before launch and cut anything that isn't true.

---

## Media constraints — not questions, just facts that shaped the design

- **Both videos had a green caption burned in.** Cropped off (280 px Casita, 400 px Gazebo). Originals untouched.
- **Both videos are vertical.** No wide desktop hero exists in the footage. The design uses this rather than fighting it.
- **The photos are small.** Most ≤1080 px; `gazebo/1.jpg` is 443×590. The dark-first design is partly a response to this — small, soft photos hold up far better on a dark ground than blown up full-bleed on white. **If you have the originals off the phone rather than the Facebook-compressed copies, that is still the single biggest quality lever on this build.**
- **Six "photos" are marketing collages** with text baked in — `Casita 1`, `Casita 2`, `Pool Area`, `Kitchen and Dining`, `Gazebo 1`, `Gazebo 2`. They're filed under `marketing`, not in the galleries. But `Gazebo 1` and `Gazebo 2` are the **only** images you have of the gazebo bedrooms. If you have the individual room shots that went into them, please send them.
- **There is no clean logo file.** `LOGO.jpg` is a photo with a signboard composited on. The real wordmark exists only baked into the corner of the casita rate cards at ~150 px. I'll trace it to SVG unless you have the original.
- **Your printed rate cards are now stale** in three places: gazebo tour times (8AM–5PM / 8PM–5AM vs your 7AM–5PM / 8PM–6AM), and the gas stove price (₱300/₱600 vs your ₱250/₱500). Worth reprinting — guests are booking off those graphics today.
