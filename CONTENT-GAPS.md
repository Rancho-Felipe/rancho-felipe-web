# Content gaps — Rancho Felipe

Everything in `content/manifest.json` came out of your folders. This file is the list of
things the folders **don't** contain, or contain **twice with different answers**. Nothing
below has been guessed.

Questions are ordered by how much they block the build. **Q1–Q3 block the booking engine.**

---

## Blocking

### Q1 — Are the Casita and the Gazebo one business or two?

They look like two. The assets give them:

| | Casita | Gazebo |
|---|---|---|
| Phone | 0995-333-9526 | 0977-277-0716 / 0951-490-9094 |
| Airbnb | `airbnb.com/h/rachofelipeteresarizal` | `airbnb.com/h/ranchofelipegazebo` |
| Rate card | Day & Night / Daytime / Night time | 22hrs / Day tour / Night tour |
| Pax bands | 10-below, 11–20 | 10-below, 16 |

The brief mentions "a whole-property option". **No asset mentions one.**

1. Is there a both-units price? If yes, what is it?
2. If someone books the Casita, is the Gazebo still bookable that same date by a different group — or does one booking close the whole property?
3. Which phone number should the website show as the main one?

**Why it blocks:** answer 2 decides whether the availability table has one calendar or two, and whether booking unit A must write a block onto unit B. That is the core of the schema.

---

### Q2 — There is no resort layout. The file in `C:\ranc layout` is someone else's website.

`C:\ranc layout` holds exactly one file: `ranch felipe layout.webp`. It is a
1024 × 4090 screenshot of **"Stayverra"**, a resort site for India and Costa Rica.
It is not Rancho Felipe, and it is not a site plan.

The interactive site map is the signature element of this build and it currently has no source art.

Pick one:

- **(a)** You have a plan drawn somewhere else — send it, even a phone photo of a paper sketch.
- **(b)** No plan exists → I draw a clean SVG site plan from `grounds-aerial-property` (the drone shot) plus your corrections. I'd send you a rough version to mark up. This is the option I'd recommend.
- **(c)** Skip the site map. The Layout page becomes a photo-led "what's on the grounds" page instead.

Either way, all **15 hotspots already have real photos** (pool, casitas, gazebo rooms, kubo, billiards, half court, function area, kitchen, bonfire, tent area, comfort rooms, parking, entrance). Only the map underneath them is missing.

If the Stayverra screenshot was meant as a **design reference** rather than a layout — tell me, because I would deliberately not copy it. It is the generic resort-template look, and the design brief asks for the opposite.

---

### Q3 — There is no weekday / weekend / holiday pricing anywhere.

The brief asks for base weekday, weekend, holiday/peak overrides. **Every rate card shows one flat price per package.** The casita text file says only "Time is Flexible."

1. Do weekend and holiday rates exist? If yes, what are they?
2. If not — should I build the fields anyway (empty, editable from admin later), or leave dynamic pricing out of v1?

**Recommendation:** build the fields and seed them all at the flat rate, so you can raise a Holy Week price yourself without me touching code.

---

## Rates and policy

### Q4 — Gazebo: what happens between 11 and 15 guests?

The gazebo card prices "10 PAX BELOW" and "16 PAX". There is no band in between, and no extra-head fee is printed. The casita charges ₱300 per additional pax — **I have not assumed that carries over.**

- Price for 11–15 pax?
- Does the gazebo have an extra-guest fee, and is it also ₱300?
- Gazebo kids policy? (Casita: 3 years and below free.)
- Is 16 a hard ceiling?

### Q5 — The 10% discount banner

`DISCOUNT/1.jpg` says "BOOK TODAY AND GET 10% DISCOUNT" with no dates and no conditions.

- Is this live right now?
- Both units or one?
- Any end date, minimum stay, or "direct bookings only" condition?
- Should the site apply it automatically at checkout, or is it a code you hand out?

### Q6 — Turnover between tours

Using your times — Day tour 07:00–17:00, Night tour 20:00–06:00, 22-hour stay 14:00–12:00:

- Night tour ends 06:00 and a day tour starts 07:00. **Is one hour enough turnover, or should the calendar refuse to sell both?**
- A 22-hour stay ends 12:00. Can a night tour start 20:00 the same day it ends?
- Same-day cutoff: how late can someone book for tonight? (e.g. "no online bookings within 6 hours of check-in")

Also, two small things:

- You said "24hrs 2pm-12nn". 14:00 to 12:00 next day is **22 hours** — which is exactly what all your rate cards price as "22HRS OF STAY". I've modelled it as 22 hours. **Do you want guests to see it labelled "22 hours" or "24 hours"?**
- **Your times don't match your printed gazebo card**, which says Day tour 8AM–5PM and Night tour 8PM–5AM. I'm using your times (07:00–17:00 and 20:00–06:00) as current. The graphic is stale and should be reissued.

### Q7 — Down payment: 30% or 50%?

Every asset says **30%**, non-refundable, date transferable. The brief says charge **50%** online. I've defaulted to 30% and made it editable. Confirm which you want.

---

## Missing facts

### Q8 — Details nothing in the folders answers

- **Email address** — needed to send confirmations and to receive booking alerts. None exists in any asset.
- **Exact GPS coordinates** — the Maps short link is in the manifest but the lat/lng behind it isn't. Needed for the `LodgingBusiness` JSON-LD and for the map pin. Open the pin and send me the numbers, or confirm I may fetch them from the link.
- **Security deposit** — the brief mentions one. No asset does. Is there one?
- **Corkage** — brief mentions it. No asset does. Do you charge it?
- **Cancellation policy beyond the DP** — assets say the DP is forfeited. Anything else?
- **House rules** — nothing in writing anywhere: noise curfew, videoke hours, pool hours, extra cars, outside food, number of pets. The `CASITA AMENITIES.png` card says pet friendly; the gazebo says nothing about pets.
- **Rough road distance** — the casita text says 250–300 m, `LOCATION.png` says 300 m + 100 m and its footer says "the final 500 metres". Which is right?
- **Review years** — the six real reviews are dated "Oct 27", "Sept 27", "July 12–15" with no year. Which year?
- **Review names** — two of the six have no name attached. Leave them anonymous?

---

## Media quality — things you should know before we design

These aren't questions so much as constraints. Flagging them now because they shape the design.

### Q9 — Both videos have a green caption burned into them

Both `PRIVATE CASITA RESORT VIDEO.mp4` and `PRIVATE GAZEBO RESORT VIDEO.mp4` carry a
bright-green **"RANCHO FELIPE (CASITA)" / "(GAZEBO)"** caption burned into the top of
every frame — the kind a phone editing app adds.

I cropped it off (280 px from the casita, 400 px from the gazebo) and re-encoded. **Your originals are untouched.** If you have the pre-caption exports, they'd be better.

### Q10 — Both videos are vertical, so there is no wide hero

Both are 1080 × 1920 handheld walkthroughs — the casita is 51 s, the gazebo 28 s. A full-bleed
desktop hero cut from vertical footage means throwing away about two-thirds of every frame.

Options:

- **(a)** Vertical video hero on phones (where most of your guests are anyway), strongest wide still on desktop. **Recommended** — costs nothing and nothing looks cropped.
- **(b)** Tight centre crop on desktop and accept the loss.
- **(c)** You shoot ~20 s of horizontal footage — a slow pan across the pool with both A-frames, and one of the gazebo pool with the parasols. That would lift the whole site.

### Q11 — The photos are small

Most are 1080 px wide or less. Four are under 700 px. `gazebo/1.jpg` is **443 × 590** — it cannot be used large anywhere.

The design brief asks for "big, uncropped" photography. At these sizes, full-bleed images will look soft on a laptop. I can design around it (contained images, tighter grids, deliberate use of the few large files) — but if you have the originals off the camera or phone rather than the Facebook-compressed copies, send those instead. **It's the single biggest quality lever on this build.**

The largest files you have, and the only ones that survive full-bleed:
`gazebo-pool-umbrellas` and `gazebo-pool-umbrellas-wide` (2048 × 1538), then
`entrance-signage`, `gazebo-garden-path`, `gazebo-pool-balcony-umbrella` (1536 × 2048).

### Q12 — Six of the "photos" are marketing collages, not photos

`Casita 1`, `Casita 2`, `Pool Area`, `Kitchen and Dining`, `Gazebo 1`, `Gazebo 2` are
composite cards with text baked in. I've filed them under `marketing` rather than in the
galleries — baked-in text can't be given proper alt text, doesn't resize cleanly, and
looks like a Facebook post on a website.

**But:** `Gazebo 1` and `Gazebo 2` are the **only** images you have of the gazebo bedrooms,
and `Casita 1` / `Casita 2` are among the few of the casita interiors. If you have the
individual room shots that went into those collages, please send them. Otherwise I'll use
the collages on the unit pages and mark them as such.

### Q13 — There is no clean logo file

`LOGO.jpg` is a photo with a wooden signboard composited onto it. The actual wordmark —
*Rancho Felipe, FARM & PRIVATE RESORT*, with the A-frame + tree + cowboy hat mark — exists
only baked into the corner of the casita rate cards at roughly 150 px wide.

Do you have the logo as PNG-with-transparency, SVG, or the original design file? If not,
I'll trace it to SVG so it stays sharp in the header, on the favicon, and in the OG image.

---

## What I did not find

Searched both folders exhaustively. **Not present anywhere:** email address, GPS coordinates,
house rules, cancellation terms beyond the DP, corkage, security deposit, weekend/holiday
rates, whole-property pricing, a site plan, a clean logo, review years, and any horizontal video.
