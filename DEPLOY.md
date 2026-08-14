# Putting the site on a permanent address

The public link you have now is a tunnel to one computer. It dies when that
machine sleeps and hands out a new address every restart. This gets you a real
one — something like `ranchofelipe.vercel.app`, up whether or not any computer
of yours is on.

It is free. It takes about ten minutes, and **two of the steps have to be done by
you**, because they mean signing in to your own accounts.

---

## Step 1 — a database that lives online  *(you)*

The database currently runs on this computer, so it goes down with it.

1. Go to **[neon.tech](https://neon.tech)** and sign up (GitHub or Google login
   is fine).
2. Create a project. Call it **rancho-felipe**. Pick the region closest to the
   Philippines — **Singapore** is the one.
3. On the project page, copy the **connection string**. It looks like:

   ```
   postgresql://neondb_owner:XXXXXXXX@ep-something-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

That string is a password. Paste it straight into `.env` on the line that starts
`DATABASE_URL=` rather than into a chat window — anything typed in chat stays in
the transcript.

> It has to be **PostgreSQL**. The rule that stops two guests booking the same
> dates is a Postgres feature that does not exist in MySQL or SQLite.

## Step 2 — sign in to GitHub  *(you)*

The code has to live somewhere Vercel can read it. One command, in this folder:

```bash
gh auth login
```

Choose **GitHub.com** → **HTTPS** → **login with a web browser**, and follow it.

---

## Step 3 — everything else

Once steps 1 and 2 are done, say so and I'll run the rest. Or run it yourself:

```bash
gh repo create rancho-felipe-web --private --source=. --push
```

Then set up the live database from this machine, using the Neon string:

```bash
npm run db:deploy
npm run db:seed
```

Then deploy:

```bash
npx vercel --prod
```

Vercel asks you to sign in the first time (browser login — again, yours to do).
Accept the defaults; it detects Next.js on its own.

## Step 4 — the settings Vercel needs

In the Vercel dashboard, **Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `DATABASE_URL` | the Neon string from step 1 |
| `AUTH_SECRET` | any long random string |
| `AUTH_URL` | your live address, e.g. `https://ranchofelipe.vercel.app` |
| `AUTH_TRUST_HOST` | `true` |
| `NEXT_PUBLIC_SITE_URL` | the same live address |
| `ADMIN_EMAIL` | casanovatraveltours@gmail.com |
| `ADMIN_USERNAME` | your admin sign-in name |
| `ADMIN_PASSWORD` | **a new one** — see the warning below |
| `EMAIL_OWNER` | casanovatraveltours@gmail.com |
| `CRON_SECRET` | any long random string |
| `RESEND_API_KEY` | when you have one |
| `PAYMONGO_SECRET_KEY` | when you have one |

Redeploy after adding them.

> **Change the admin password.** The current one has been typed into a chat
> transcript, and the site is about to be permanently reachable. Put a new one in
> `ADMIN_PASSWORD` and run `npm run db:seed` again against the live database.

## Step 5 — the things that only work once the address is fixed

- **PayMongo webhook — nothing to do.** There is no webhook screen in the
  PayMongo dashboard; webhooks exist only through their API. Rather than leave
  that as a step someone has to remember, the site registers its own: the first
  time a guest starts a checkout, and again on the nightly job. Setting
  `PAYMONGO_SECRET_KEY` is the whole of switching payments on.

  The nightly run matters as much as the first one. PayMongo disables a webhook
  after three events exhaust their retries, and says nothing — left alone that
  reads as payments quietly not confirming. The check switches it back on.

  To see the answer now rather than infer it from a payment going through:

  ```bash
  npm run paymongo:webhook
  ```

  Same code the server runs. It never prints your key.

  This is why automatic payment needed a permanent address: a tunnel changes
  name and the webhook starts calling nowhere.
- **Airbnb calendars** → give Airbnb
  `https://YOUR-ADDRESS/api/ical/casita.ics` and
  `https://YOUR-ADDRESS/api/ical/gazebo.ics`, and paste Airbnb's own export
  links into Admin → Settings.
- **The scheduled job** runs itself. `vercel.json` already tells Vercel to call
  `/api/cron` twice an hour to release expired holds and pull the Airbnb
  calendars.

## Your own domain, later

If you buy something like `ranchofelipe.ph`, add it in Vercel under **Settings →
Domains** and follow their DNS steps. Then update `AUTH_URL` and
`NEXT_PUBLIC_SITE_URL` to match, and repoint the PayMongo webhook. Nothing else
changes.
