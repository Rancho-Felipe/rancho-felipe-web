import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getSettings } from '@/lib/settings'
import { updateSettings, saveIcalFeed } from '@/lib/admin/actions'
import { inResortTime } from '@/lib/booking/schedule'
import { emailIsConfigured } from '@/lib/email/send'

export const metadata: Metadata = { title: 'Settings', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const [settings, units, feeds] = await Promise.all([
    getSettings(),
    db.unit.findMany({ orderBy: { sortOrder: 'asc' } }),
    db.icalFeed.findMany(),
  ])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3007'

  async function saveBooking(formData: FormData) {
    'use server'
    await updateSettings({
      depositPercent: Number(formData.get('depositPercent')),
      turnoverMinutes: Number(formData.get('turnoverMinutes')),
      holdHours: Number(formData.get('holdHours')),
      sameDayCutoffHours: Number(formData.get('sameDayCutoffHours')),
      videokeCurfew: String(formData.get('videokeCurfew')),
    })
  }

  async function savePayments(formData: FormData) {
    'use server'
    await updateSettings({
      paymentMethods: {
        gcash: formData.get('gcash') === 'on',
        maya: formData.get('maya') === 'on',
        bpi: formData.get('bpi') === 'on',
        paymongo: formData.get('paymongo') === 'on',
      },
      bankDetails: {
        gcash: {
          number: String(formData.get('gcashNumber')),
          name: String(formData.get('accountName')),
        },
        maya: {
          number: String(formData.get('mayaNumber')),
          name: String(formData.get('accountName')),
        },
        bpi: {
          account: String(formData.get('bpiAccount')),
          name: String(formData.get('accountName')),
        },
      },
    })
  }

  async function saveFeed(formData: FormData) {
    'use server'
    await saveIcalFeed(String(formData.get('unitId')), String(formData.get('url') ?? ''))
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="text-title font-display">Settings</h1>

      {!emailIsConfigured() && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-brick/50 bg-night-raised px-5 py-4 text-sm text-brick-lift"
        >
          Email is not switched on yet. Bookings still work, but no receipts are being sent. Add a
          Resend API key to <span className="font-data">RESEND_API_KEY</span> to turn it on.
        </p>
      )}

      {/* --- booking rules -------------------------------------------------- */}
      <section className="mt-8 rounded-2xl border border-night-edge bg-night-raised p-6">
        <h2 className="font-display text-lg">Booking rules</h2>
        <form action={saveBooking} className="mt-4 grid gap-5 sm:grid-cols-2">
          <NumberField
            name="depositPercent"
            label="Deposit"
            suffix="%"
            defaultValue={settings.depositPercent}
            hint="What a guest pays to hold a date"
            min={1}
            max={100}
          />
          <NumberField
            name="turnoverMinutes"
            label="Turnover"
            suffix="min"
            defaultValue={settings.turnoverMinutes}
            hint="Added to both ends, so 30 gives an hour between groups. It cannot go higher without breaking the night-then-day pair."
            min={0}
            max={30}
          />
          <NumberField
            name="holdHours"
            label="Hold a date for"
            suffix="hours"
            defaultValue={settings.holdHours}
            hint="Before an unpaid booking releases"
            min={1}
            max={168}
          />
          <NumberField
            name="sameDayCutoffHours"
            label="Stop online bookings"
            suffix="hours before"
            defaultValue={settings.sameDayCutoffHours}
            hint="Guests inside this window are told to call"
            min={0}
            max={72}
          />
          <label className="block">
            <span className="eyebrow block">Videoke until</span>
            <input
              type="time"
              name="videokeCurfew"
              defaultValue={settings.videokeCurfew}
              className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 font-data text-sm text-paper"
            />
            <span className="mt-1 block text-xs text-stone">Printed in the guest&apos;s house rules</span>
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-pool px-6 py-2.5 text-sm font-medium text-paper"
            >
              Save booking rules
            </button>
          </div>
        </form>
      </section>

      {/* --- payments -------------------------------------------------------- */}
      <section className="mt-8 rounded-2xl border border-night-edge bg-night-raised p-6">
        <h2 className="font-display text-lg">How guests pay</h2>
        <p className="mt-1 text-sm text-stone">
          These details appear on every guest&apos;s booking page and in their email.
        </p>

        <form action={savePayments} className="mt-4 space-y-5">
          <label className="block">
            <span className="eyebrow block">Account name</span>
            <input
              name="accountName"
              defaultValue={settings.bankDetails.gcash.name}
              className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 text-sm text-paper"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <Method
              name="gcash"
              label="GCash"
              on={settings.paymentMethods.gcash}
              field="gcashNumber"
              value={settings.bankDetails.gcash.number}
            />
            <Method
              name="maya"
              label="Maya"
              on={settings.paymentMethods.maya}
              field="mayaNumber"
              value={settings.bankDetails.maya.number}
            />
            <Method
              name="bpi"
              label="BPI"
              on={settings.paymentMethods.bpi}
              field="bpiAccount"
              value={settings.bankDetails.bpi.account}
            />
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-night-edge px-4 py-3">
            <input
              type="checkbox"
              name="paymongo"
              defaultChecked={settings.paymentMethods.paymongo}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block text-sm text-paper">Card and e-wallet payments (PayMongo)</span>
              <span className="block text-xs text-stone">
                Only switch this on once PayMongo keys are in the environment. Without them the site
                falls back to the receipt-upload flow, which is how the resort already works.
              </span>
            </span>
          </label>

          <button
            type="submit"
            className="rounded-full bg-pool px-6 py-2.5 text-sm font-medium text-paper"
          >
            Save payment details
          </button>
        </form>
      </section>

      {/* --- airbnb ---------------------------------------------------------- */}
      <section className="mt-8 rounded-2xl border border-night-edge bg-night-raised p-6">
        <h2 className="font-display text-lg">Airbnb calendars</h2>
        <p className="mt-1 text-sm text-stone">
          Two halves. Give Airbnb the link below so it knows about direct bookings, and paste
          Airbnb&apos;s own export link here so this site knows about Airbnb bookings.
        </p>

        <div className="mt-5 space-y-6">
          {units.map((unit) => {
            const feed = feeds.find((f) => f.unitId === unit.id)
            return (
              <div key={unit.id} className="border-t hairline pt-5 first:border-t-0 first:pt-0">
                <h3 className="text-sm text-paper">{unit.name}</h3>

                <p className="mt-2 eyebrow">Give this to Airbnb</p>
                <p className="mt-1 break-all rounded-lg bg-night px-3 py-2 font-data text-xs text-stone">
                  {siteUrl}/api/ical/{unit.id}.ics
                </p>

                <form action={saveFeed} className="mt-4 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="unitId" value={unit.id} />
                  <label className="min-w-[18rem] flex-1">
                    <span className="eyebrow block">Airbnb&apos;s export link</span>
                    <input
                      name="url"
                      type="url"
                      defaultValue={feed?.url ?? ''}
                      placeholder="https://www.airbnb.com/calendar/ical/..."
                      className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 font-data text-xs text-paper"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded-full border border-stone/40 px-5 py-2.5 text-sm text-paper hover:border-stone"
                  >
                    Save
                  </button>
                </form>

                {feed && (
                  <p className={`mt-2 text-xs ${feed.lastError ? 'text-brick-lift' : 'text-stone'}`}>
                    {feed.lastError
                      ? `Last import failed: ${feed.lastError}`
                      : feed.lastOkAt
                        ? `Last imported ${inResortTime(feed.lastOkAt)}`
                        : 'Not imported yet â€” it will run within half an hour.'}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function NumberField({
  name,
  label,
  suffix,
  defaultValue,
  hint,
  min,
  max,
}: {
  name: string
  label: string
  suffix: string
  defaultValue: number
  hint: string
  min: number
  max: number
}) {
  return (
    <label className="block">
      <span className="eyebrow block">{label}</span>
      <span className="mt-1.5 flex items-center gap-2">
        <input
          type="number"
          name={name}
          defaultValue={defaultValue}
          min={min}
          max={max}
          className="w-28 rounded-lg border border-night-edge bg-night px-3 py-2.5 font-data text-sm text-paper"
        />
        <span className="font-data text-xs text-stone">{suffix}</span>
      </span>
      <span className="mt-1 block text-xs text-stone">{hint}</span>
    </label>
  )
}

function Method({
  name,
  label,
  on,
  field,
  value,
}: {
  name: string
  label: string
  on: boolean
  field: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-night-edge p-4">
      <label className="flex items-center gap-2">
        <input type="checkbox" name={name} defaultChecked={on} className="h-4 w-4" />
        <span className="text-sm text-paper">{label}</span>
      </label>
      <input
        name={field}
        defaultValue={value}
        className="mt-3 w-full rounded-lg border border-night-edge bg-night px-3 py-2 font-data text-xs text-paper"
      />
    </div>
  )
}
