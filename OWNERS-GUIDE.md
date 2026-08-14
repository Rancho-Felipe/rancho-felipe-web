# Running Rancho Felipe

Everything you need to do from a phone. No technical knowledge assumed.

Your admin page is at **yoursite.com/admin**. Bookmark it.

---

## Signing in

Go to `/admin`. Your username is the one set as `ADMIN_USERNAME` when the site
was set up — your email address works too, if that's easier to remember.

You stay signed in for 12 hours, then it asks again — that way a phone left on a
table doesn't leave the resort's bookings open.

**Forgot the password?** It can't be emailed to you — there is no reset link,
which is deliberate: one fewer door into the resort's bookings. Whoever set the
site up changes it by putting a new one in `ADMIN_PASSWORD` and re-running the
seed.

---

## Every morning: the Today page

This is the first page you see. Top to bottom, it's in the order that matters.

**A red box at the very top** means the Airbnb calendar has stopped updating.
While that box is showing, a date could be booked on Airbnb without this site
knowing. Check Airbnb by hand before you confirm anything. If it doesn't clear
by itself within an hour, tell whoever set the site up.

**Waiting on you** — guests who have sent their deposit and are waiting for you
to look at the receipt. Tap one to check it.

**Arriving today / Leaving today** — who's coming, what time, how many people,
and how much money to collect on arrival.

**This month** — bookings, money booked, deposits received, and how full each
unit is.

---

## Letting guests pay and book by themselves

Right now nothing is automatic: a guest books, sends you GCash, uploads a
screenshot, and **you** confirm it. That works, and it needs no accounts.

To make it automatic you need **PayMongo**. Then a guest pays by GCash, Maya,
card or QR Ph on PayMongo's own page, and the booking **confirms itself the
moment the money lands** — no screenshot, nothing in your queue, even at 2am.

**What you have to do:**

1. Sign up at [paymongo.com](https://paymongo.com) and finish their business
   verification. They'll ask for your ID and business details, and they take a
   fee per transaction — check their current rates.
2. Give your **secret key** to whoever set the site up. It starts with `sk_`.
   There's a test one for trying it out and a live one for real money.
3. In PayMongo, add a webhook pointing at the address shown in
   **Settings → How guests pay**, subscribed to `payment.paid` and
   `payment.failed`.
4. Tick **"Guests pay online and book themselves"** in Settings.

Until all four are done, the box stays off and guests send the deposit manually.
You lose nothing by waiting.

**Both ways can run at once.** Even with PayMongo on, the manual GCash details
and receipt upload stay on the page underneath for anyone who prefers them.

> Your money goes to PayMongo first and they pay out to your bank on their own
> schedule — it does not land in your GCash instantly the way a direct transfer
> does. That's the trade for it being automatic.

## Someone sent a deposit — what do I do?

1. Tap the booking under **Waiting on you**.
2. The receipt they uploaded is right there. Check the amount and that it went
   to your account.
3. **Payment is good — confirm.** Done. The guest gets a confirmation email with
   the house rules and directions, and the date is locked in.

**If the receipt is wrong** — type a short reason and tap **Reject**. The
booking goes back to unpaid and *the date stays held*, so they can send the right
screenshot without losing their slot.

**If they paid you in cash or in person** — open the booking and tap
**They paid in cash — confirm**.

---

## Seeing what's free, and closing dates

**Calendar.** You get a month grid for each unit, one under the other.

Every date has **three dots** — day tour, night tour, full stay, in that order.
A date is never simply free or booked: someone can take the day tour while the
night tour that evening is still open.

| Dot | Means |
|---|---|
| 🟢 green | still bookable |
| 🔴 red | taken, or you closed it |
| ⚪ grey (pale) | too close to check-in to book online |
| ⚫ dark | already past |

Use **Previous** and **Next** to move through the months. Today's date has a
blue outline.

This is the same information the website shows guests — it's read from the same
place — so what you see here is exactly what they see.

### Closing dates

When the resort isn't taking guests — repairs, family using it, a fiesta.

**Tap any date in the grid** and it fills in the form below for you. Or fill it
in yourself: pick the unit, the dates, and a short reason like "repairs". Tap
**Close these dates**.

Those dates immediately stop being bookable here **and** on Airbnb, because the
site tells Airbnb about them.

To open them again, find them under **Closed dates** and tap **Reopen**.

> Dates marked **from Airbnb** can't be reopened here. They came from a real
> Airbnb booking. Cancel it on Airbnb and it clears itself within half an hour.

---

## Changing prices

**Rates.** Every price is a box you can type in. Change it, tap Save, and the
website updates straight away.

Remember how the prices work:

- Each price covers **up to 10 guests**.
- Guest 11 and beyond costs **₱300 each** (children 3 and under are free and
  don't count).
- Extra hours are per hour, and only offered to a guest when nobody is booked
  after them.

So the Gazebo at ₱8,000 for a 22-hour stay with 14 guests comes to
₱8,000 + (4 × ₱300) = ₱9,200.

**Weekend and holiday prices** aren't set up. Every date currently costs the
same. If you want Holy Week to cost more, say so and it can be added.

---

## Changing the rules

**Settings.**

- **Deposit** — the percentage a guest pays to hold a date. Currently 30%.
- **Turnover** — cleaning time added to *both* ends of every booking. At 30 you
  get a full hour between one group leaving and the next arriving. It won't go
  higher: that would eat the gap between a night tour ending at 6am and a day
  tour starting at 7am, and that pair would stop being bookable.
- **Hold a date for** — how long an unpaid booking keeps its date before the
  date goes back on sale. Currently 24 hours.
- **Stop online bookings** — how close to check-in the website stops taking
  bookings. Guests inside that window are told to call you.
- **Videoke until** — printed in every guest's house rules.

**Your payment details** are on the same page. Whatever you type there is what
guests see on their booking page and in their email — so if your GCash number
ever changes, change it here and everywhere updates at once.

---

## Your Facebook and TikTok

**Marketing.** Two things live here.

**Your accounts.** Add your Facebook Page, your Facebook profile, TikTok and
Instagram. Each one gets an **Open page** link and, if you paste an inbox link,
a **Check messages** button that opens the real inbox in a new tab.

> **Messages are not shown inside this page, and that's deliberate.** Facebook
> only hands over Page messages to an approved Meta developer app with a Page
> token and business verification, and the access expires and has to be renewed.
> TikTok gives no message access at all. A message list here would sit empty and
> look like nobody had written to you — so you'd stop checking the real inbox and
> miss bookings. The buttons take you to the real thing instead. If you want
> Facebook connected properly later, that's separate work and it starts with a
> Meta Business account.

**Writing posts.** Pick one of the ready captions — *Weekend dates still open*,
*Day tour*, *Night tour and bonfire*, *Thank a group who stayed* — and it fills
in with **your current prices and the weekends that are genuinely still free**.
Nothing is typed in by hand, so a post can never advertise a price you stopped
charging or a date you already sold.

Edit it, tap **Copy caption**, then paste it into Facebook or TikTok. Save it as
a draft or give it a date so you remember to post it. It doesn't publish by
itself — you still press the button on the app.

## Connecting Airbnb

Do this once per unit. It stops the worst thing that can happen: two groups
turning up on the same day.

**Settings → Airbnb calendars.**

**Tell Airbnb about this site:**
1. Copy the link shown for that unit (it ends in `.ics`).
2. In Airbnb: Calendar → Availability → Connect another website → Paste it.

**Tell this site about Airbnb:**
1. In Airbnb: Calendar → Availability → Export calendar → copy that link.
2. Paste it into the box for that unit here and tap Save.

The site checks Airbnb every half hour. Under the box it tells you when it last
worked — or shows a red message if it isn't working.

---

## Finding a booking

**Bookings.** Search by reference (`RF-C-2026-0042`), name, email or phone.

The filters along the top: **Check receipt** is your to-do list, **Unpaid** is
people who haven't sent a deposit yet, **Upcoming** is everyone still to come.

**Download CSV** gives you a spreadsheet of whatever you're looking at — useful
for accounts.

The reference tells you which unit: **RF-C** is the Casita, **RF-G** is the
Gazebo.

---

## Cancelling a booking

Open it, type a reason, tap **Cancel this booking**. The date is free again
straight away.

The guest is *not* emailed automatically — message them yourself, so it comes
from a person.

---

## Photos and words

Photos and page text aren't editable from admin yet. Send new photos to whoever
set up the site and they'll be added — they need converting first so they load
fast on mobile data.

**Reviews** are stored and can be hidden or reordered, but that screen isn't
built yet either. Ask if you need one changed.

---

## When something looks wrong

**"A guest says they booked but I can't see it."** Search their email under
Bookings. If it says **Unpaid**, they never sent the deposit — the date may have
been released after 24 hours.

**"Two people booked the same date."** This shouldn't be possible through the
website; the database refuses it. If it happens, it came through Airbnb while
the calendar sync was broken. Check the Today page for the red box.

**"The prices on the website are wrong."** Check Rates. What's there is what
guests see. Your old printed tarpaulins say something different in a few places
— see `CONTENT-GAPS.md` for exactly which.

**"No one is getting emails."** Settings will say so at the top if email isn't
switched on. It needs a Resend account key from whoever set the site up.
Bookings still work fine without it — you just have to message guests yourself.

---

## The things worth knowing

- A guest's date is held **the moment they book**, before any money moves. That's
  deliberate — it stops two people racing for the same weekend.
- An unpaid hold **releases itself** after 24 hours.
- A booking with a receipt uploaded **never** releases itself. It waits for you.
- Rejecting a payment **keeps the date held**.
- The Casita and the Gazebo are **completely separate calendars**. One being
  booked never blocks the other.
