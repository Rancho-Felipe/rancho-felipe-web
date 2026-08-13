# Running Rancho Felipe

Everything you need to do from a phone. No technical knowledge assumed.

Your admin page is at **yoursite.com/admin**. Bookmark it.

---

## Signing in

Go to `/admin`. Your username is **vanzdix** — your email address works too, if
that's easier to remember.

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

## Blocking dates

When the resort isn't taking guests — repairs, family using it, a fiesta.

**Calendar → Close some dates.** Pick the unit, the dates, and a short reason
like "repairs". Tap **Close these dates**.

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
