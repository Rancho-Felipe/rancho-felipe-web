'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type UnitSlug = 'casita' | 'gazebo'
type PackageKey = 'DAY_TOUR' | 'NIGHT_TOUR' | 'FULL_STAY'

interface AddOn {
  id: string
  name: string
  note: string | null
  price: number
  payOnSite: boolean
}

interface QuoteLine {
  key: string
  label: string
  detail?: string
  amount: number
  payOnSite?: boolean
}

interface QuoteResponse {
  state: 'free' | 'taken' | 'past' | 'cutoff'
  available: boolean
  checkInAt: string
  checkOutAt: string
  maxGuests: number
  overCapacity: boolean
  addOns: AddOn[]
  quote: {
    lines: QuoteLine[]
    total: number
    depositDue: number
    balanceDue: number
    chargeableGuests: number
  }
}

const PACKAGES: { key: PackageKey; label: string; window: string; hours: string }[] = [
  { key: 'DAY_TOUR', label: 'Day tour', window: '7:00 AM → 5:00 PM', hours: '10 hours' },
  { key: 'NIGHT_TOUR', label: 'Night tour', window: '8:00 PM → 6:00 AM', hours: '10 hours, overnight' },
  { key: 'FULL_STAY', label: 'Full stay', window: '2:00 PM → 12:00 NN', hours: '22 hours' },
]

const UNITS: { slug: UnitSlug; name: string; blurb: string }[] = [
  { slug: 'casita', name: 'The Casita', blurb: 'Two A-frames, own pool' },
  { slug: 'gazebo', name: 'The Gazebo', blurb: 'Two rooms, own pool' },
]

const STATE_MESSAGE: Record<QuoteResponse['state'], string> = {
  free: '',
  taken: 'That slot is already booked. Try another date or the other unit.',
  past: 'That time has already passed.',
  cutoff: 'This starts too soon to book online. Please call or message the resort.',
}

function peso(value: number) {
  return `₱${value.toLocaleString('en-PH')}`
}

export function BookingForm({
  initialUnit,
  initialDate,
  initialGuests,
  minDate,
  extensionRates,
}: {
  initialUnit: UnitSlug
  initialDate: string
  initialGuests: number
  minDate: string
  extensionRates: Record<UnitSlug, number>
}) {
  const router = useRouter()

  const [unit, setUnit] = useState<UnitSlug>(initialUnit)
  const [date, setDate] = useState(initialDate)
  const [pkg, setPkg] = useState<PackageKey>('FULL_STAY')
  const [guests, setGuests] = useState(initialGuests)
  const [under4, setUnder4] = useState(0)
  const [pets, setPets] = useState(0)
  const [extensionHours, setExtensionHours] = useState(0)
  const [addOnIds, setAddOnIds] = useState<string[]>([])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [website, setWebsite] = useState('') // honeypot

  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [pricing, setPricing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const selection = useMemo(
    () => ({ unit, package: pkg, date, guests, under4, pets, extensionHours, addOnIds }),
    [unit, pkg, date, guests, under4, pets, extensionHours, addOnIds],
  )

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    const controller = new AbortController()
    setPricing(true)

    debounce.current = setTimeout(() => {
      fetch('/api/quote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(selection),
        signal: controller.signal,
      })
        .then(async (response) => {
          const data = await response.json()
          if (!response.ok) throw new Error(data.error ?? 'Could not price that.')
          return data as QuoteResponse
        })
        .then((data) => {
          setQuote(data)
          setQuoteError(null)
          // Drop any add-on that no longer applies to this unit or package.
          setAddOnIds((current) => {
            const allowed = new Set(data.addOns.map((a) => a.id))
            const next = current.filter((id) => allowed.has(id))
            return next.length === current.length ? current : next
          })
        })
        .catch((cause: Error) => {
          if (cause.name === 'AbortError') return
          setQuote(null)
          setQuoteError(cause.message)
        })
        .finally(() => setPricing(false))
    }, 250)

    return () => {
      controller.abort()
      if (debounce.current) clearTimeout(debounce.current)
    }
  }, [selection])

  const canSubmit =
    !!quote?.available && !submitting && name.length > 1 && email.includes('@') && phone.length > 6 && address.length > 3

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitError(null)
    setSubmitting(true)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...selection, name, email, phone, address, note, website }),
      })
      const data = await response.json()

      if (!response.ok) {
        setSubmitError(data.error ?? 'Could not hold that date.')
        // Someone else took it while the form was open — refresh the price panel
        // so the guest can see the new state rather than retrying blindly.
        if (data.slotTaken) setSelectionStale()
        return
      }

      router.push(`/book/${data.reference}`)
    } catch {
      setSubmitError('We could not reach the resort just now. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function setSelectionStale() {
    setQuote((current) => (current ? { ...current, available: false, state: 'taken' } : current))
  }

  const accent = unit === 'casita' ? 'bg-pool' : 'bg-brick'
  const accentText = unit === 'casita' ? 'text-pool' : 'text-brick'
  const accentBorder = unit === 'casita' ? 'border-pool' : 'border-brick'

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="space-y-10">
        {/* --- unit ------------------------------------------------------- */}
        <fieldset>
          <legend className="eyebrow">Which one</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {UNITS.map((option) => (
              <label
                key={option.slug}
                className={`cursor-pointer rounded-xl border px-4 py-3.5 transition-colors ${
                  unit === option.slug
                    ? `${option.slug === 'casita' ? 'border-pool' : 'border-brick'} bg-night-raised`
                    : 'border-night-edge hover:border-stone/50'
                }`}
              >
                <input
                  type="radio"
                  name="unit"
                  className="sr-only"
                  checked={unit === option.slug}
                  onChange={() => setUnit(option.slug)}
                />
                <span className="block text-sm text-paper">{option.name}</span>
                <span className="block text-xs text-stone">{option.blurb}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* --- when ------------------------------------------------------- */}
        <fieldset>
          <legend className="eyebrow">When</legend>
          <div className="mt-3">
            <label htmlFor="date" className="sr-only">
              Arrival date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              min={minDate}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-lg border border-night-edge bg-night px-3 py-2.5 font-data text-sm text-paper"
              required
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {PACKAGES.map((option) => (
              <label
                key={option.key}
                className={`cursor-pointer rounded-xl border px-4 py-3.5 transition-colors ${
                  pkg === option.key ? `${accentBorder} bg-night-raised` : 'border-night-edge hover:border-stone/50'
                }`}
              >
                <input
                  type="radio"
                  name="package"
                  className="sr-only"
                  checked={pkg === option.key}
                  onChange={() => setPkg(option.key)}
                />
                <span className="block text-sm text-paper">{option.label}</span>
                <span className="mt-0.5 block font-data text-xs text-stone">{option.window}</span>
                <span className="block text-xs text-stone">{option.hours}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* --- who -------------------------------------------------------- */}
        <fieldset>
          <legend className="eyebrow">How many</legend>
          <div className="mt-3 flex flex-wrap gap-5">
            <Field label="Guests" hint="Everyone, including children">
              <input
                type="number"
                min={1}
                max={60}
                value={guests}
                onChange={(event) => setGuests(Math.max(1, Number(event.target.value) || 1))}
                className="w-28 rounded-lg border border-night-edge bg-night px-3 py-2.5 font-data text-sm text-paper"
              />
            </Field>
            <Field label="Aged 3 and under" hint="They stay free">
              <input
                type="number"
                min={0}
                max={guests}
                value={under4}
                onChange={(event) => setUnder4(Math.max(0, Number(event.target.value) || 0))}
                className="w-28 rounded-lg border border-night-edge bg-night px-3 py-2.5 font-data text-sm text-paper"
              />
            </Field>
            <Field label="Pets" hint="Up to 3 free, never in the pool">
              <input
                type="number"
                min={0}
                max={20}
                value={pets}
                onChange={(event) => setPets(Math.max(0, Number(event.target.value) || 0))}
                className="w-28 rounded-lg border border-night-edge bg-night px-3 py-2.5 font-data text-sm text-paper"
              />
            </Field>
            <Field label="Extra hours" hint={`${peso(extensionRates[unit])} each, if free`}>
              <input
                type="number"
                min={0}
                max={12}
                value={extensionHours}
                onChange={(event) => setExtensionHours(Math.max(0, Number(event.target.value) || 0))}
                className="w-28 rounded-lg border border-night-edge bg-night px-3 py-2.5 font-data text-sm text-paper"
              />
            </Field>
          </div>

          {quote?.overCapacity && (
            <p className="mt-3 text-sm text-brick-lift">
              That&apos;s more than {quote.maxGuests} guests. We can usually make it work — please
              message the resort so they can prepare.
            </p>
          )}
        </fieldset>

        {/* --- add-ons ----------------------------------------------------- */}
        {quote && quote.addOns.length > 0 && (
          <fieldset>
            <legend className="eyebrow">Anything else</legend>
            <div className="mt-3 space-y-2.5">
              {quote.addOns.map((addOn) => (
                <label
                  key={addOn.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-night-edge px-4 py-3 hover:border-stone/50"
                >
                  <input
                    type="checkbox"
                    checked={addOnIds.includes(addOn.id)}
                    onChange={(event) =>
                      setAddOnIds((current) =>
                        event.target.checked
                          ? [...current, addOn.id]
                          : current.filter((id) => id !== addOn.id),
                      )
                    }
                    className="mt-1 h-4 w-4 accent-current"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-paper">
                      {addOn.name} <span className="font-data text-stone">{peso(addOn.price)}</span>
                    </span>
                    {addOn.note && <span className="block text-xs text-stone">{addOn.note}</span>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {/* --- details ----------------------------------------------------- */}
        <fieldset>
          <legend className="eyebrow">Your details</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <TextField id="name" label="Name" value={name} onChange={setName} required autoComplete="name" />
            <TextField id="email" label="Email" type="email" value={email} onChange={setEmail} required autoComplete="email" hint="Your receipt goes here" />
            <TextField id="phone" label="Contact number" value={phone} onChange={setPhone} required autoComplete="tel" inputMode="tel" />
            <TextField id="address" label="Address" value={address} onChange={setAddress} required autoComplete="street-address" />
          </div>

          <div className="mt-4">
            <label htmlFor="note" className="eyebrow block">
              Anything we should know
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              maxLength={1000}
              className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 text-sm text-paper"
              placeholder="Arriving late, celebrating a birthday, anything at all."
            />
          </div>

          {/* Honeypot. Hidden from people, irresistible to bots. */}
          <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="website">Leave this empty</label>
            <input
              id="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>
        </fieldset>
      </div>

      {/* --- price panel --------------------------------------------------- */}
      <aside className="lg:sticky lg:top-24">
        <div className="rounded-2xl border border-night-edge bg-night-raised p-6">
          <h2 className={`font-display text-lg ${accentText}`}>
            {unit === 'casita' ? 'The Casita' : 'The Gazebo'}
          </h2>

          {quote && (
            <p className="mt-1 font-data text-xs text-stone">
              {new Date(quote.checkInAt).toLocaleString('en-PH', {
                timeZone: 'Asia/Manila',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
              {' → '}
              {new Date(quote.checkOutAt).toLocaleString('en-PH', {
                timeZone: 'Asia/Manila',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </p>
          )}

          {quoteError && (
            <p role="alert" className="mt-4 text-sm text-brick-lift">
              {quoteError}
            </p>
          )}

          {quote && !quote.available && (
            <p role="alert" className="mt-4 rounded-lg bg-night px-3 py-2.5 text-sm text-brick-lift">
              {STATE_MESSAGE[quote.state]}
            </p>
          )}

          {quote && (
            <>
              <dl className="mt-5 space-y-2.5 border-t hairline pt-4">
                {quote.quote.lines.map((line) => (
                  <div key={line.key} className="flex items-start justify-between gap-4">
                    <dt className="min-w-0 text-sm text-stone">
                      {line.label}
                      {line.detail && <span className="block text-xs text-stone/70">{line.detail}</span>}
                    </dt>
                    <dd className="shrink-0 font-data text-sm text-paper">{peso(line.amount)}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 space-y-2 border-t hairline pt-4">
                <Row label="Total" value={peso(quote.quote.total)} strong />
                <Row label="Pay now to hold it" value={peso(quote.quote.depositDue)} accent={accentText} />
                <Row label="On arrival" value={peso(quote.quote.balanceDue)} />
              </div>
            </>
          )}

          {pricing && !quote && <p className="mt-4 text-sm text-stone">Checking…</p>}

          {submitError && (
            <p role="alert" className="mt-4 text-sm text-brick-lift">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`mt-6 w-full rounded-full px-6 py-3 font-medium text-paper transition-opacity ${accent} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {submitting ? 'Holding your date…' : 'Hold this date'}
          </button>

          <p className="mt-3 text-xs text-stone">
            Nothing is charged here. We hold the date and send you payment details — the booking is
            confirmed once your 30% deposit lands.
          </p>
        </div>
      </aside>
    </form>
  )
}

function Row({
  label,
  value,
  strong,
  accent,
}: {
  label: string
  value: string
  strong?: boolean
  accent?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={`text-sm ${strong ? 'text-paper' : 'text-stone'}`}>{label}</span>
      <span className={`font-data ${strong ? 'text-base text-paper' : `text-sm ${accent ?? 'text-stone'}`}`}>
        {value}
      </span>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="eyebrow block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone">{hint}</span>}
    </label>
  )
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required,
  autoComplete,
  inputMode,
  hint,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  autoComplete?: string
  inputMode?: 'tel' | 'text' | 'email'
  hint?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow block">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 text-sm text-paper"
      />
      {hint && <p className="mt-1 text-xs text-stone">{hint}</p>}
    </div>
  )
}
