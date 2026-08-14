'use client'

import { useEffect, useId, useState, useTransition } from 'react'
import Link from 'next/link'
import { HOTSPOTS, PlanArtwork, type Hotspot } from '@/components/site-map/plan'

interface PhotoSource {
  avif: string
  webp: string
  fallback: string
  width: number
  height: number
  alt: string
}

interface Slot {
  package: 'DAY_TOUR' | 'NIGHT_TOUR' | 'FULL_STAY'
  label: string
  checkIn: string
  checkOut: string
  state: 'free' | 'taken' | 'past' | 'cutoff'
  price: number | null
}

interface UnitDayView {
  unitId: 'casita' | 'gazebo'
  slots: Slot[]
  anyFree: boolean
}

const UNIT_NAME = { casita: 'The Casita', gazebo: 'The Gazebo' } as const

const STATE_TEXT: Record<Slot['state'], string> = {
  free: 'Free',
  taken: 'Booked',
  past: 'Past',
  cutoff: 'Call to book',
}

function peso(value: number) {
  return `₱${value.toLocaleString('en-PH')}`
}

/**
 * The site plan doubles as the availability view.
 *
 * A list of dates cannot show that one side of the farm is busy while the other
 * is free. The map can — and that is the whole point of the two units keeping
 * separate calendars.
 */
export function SiteMap({
  initialDate,
  initialUnits,
  photos,
}: {
  initialDate: string
  initialUnits: UnitDayView[]
  photos: Record<string, PhotoSource>
}) {
  const [date, setDate] = useState(initialDate)
  const [guests, setGuests] = useState(10)
  const [units, setUnits] = useState(initialUnits)
  const [selected, setSelected] = useState<Hotspot | null>(null)
  const [loading, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const headingId = useId()

  useEffect(() => {
    if (date === initialDate && guests === 10) return
    const controller = new AbortController()

    startTransition(() => {})
    setError(null)

    fetch(`/api/availability?mode=day&date=${date}&guests=${guests}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).error ?? 'Could not load')
        return response.json()
      })
      .then((data) => setUnits(data.units))
      // If availability cannot be read, say so. Never fall back to showing the
      // farm as free.
      .catch((cause: Error) => {
        if (cause.name === 'AbortError') return
        setError("We couldn't check the calendar just now. Please try again.")
      })

    return () => controller.abort()
  }, [date, guests, initialDate])

  const busyUnits = new Set(units.filter((unit) => !unit.anyFree).map((unit) => unit.unitId))

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="sr-only">
        Farm map and availability
      </h2>

      {/* --- controls ----------------------------------------------------- */}
      <div className="flex flex-wrap items-end gap-4 rounded-t-2xl border border-b-0 border-night-edge bg-night-raised px-5 py-4">
        <div>
          <label htmlFor="map-date" className="eyebrow block">
            Date
          </label>
          <input
            id="map-date"
            type="date"
            value={date}
            min={initialDate}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1.5 rounded-lg border border-night-edge bg-night px-3 py-2 font-data text-sm text-paper"
          />
        </div>
        <div>
          <label htmlFor="map-guests" className="eyebrow block">
            Guests
          </label>
          <input
            id="map-guests"
            type="number"
            min={1}
            max={40}
            value={guests}
            onChange={(event) => setGuests(Math.max(1, Number(event.target.value) || 1))}
            className="mt-1.5 w-24 rounded-lg border border-night-edge bg-night px-3 py-2 font-data text-sm text-paper"
          />
        </div>
        {loading && <p className="pb-2 text-xs text-stone">Checking…</p>}
      </div>

      {/* --- the plan ------------------------------------------------------ */}
      <div className="overflow-x-auto border-x border-night-edge bg-night-raised">
        <div className="min-w-[46rem] px-4 py-4">
          <svg
            viewBox="0 0 1000 700"
            className="h-auto w-full"
            role="img"
            aria-label="Plan of Rancho Felipe showing the casitas, the gazebo, both pools and the shared grounds"
          >
            <style>{`.plan-note{font-size:15px;fill:var(--color-stone);font-family:var(--font-data),monospace;letter-spacing:.08em}`}</style>
            <PlanArtwork dimZone={(zone) => busyUnits.has(zone)} />

            {HOTSPOTS.map((spot) => {
              const dim = spot.zone !== 'shared' && busyUnits.has(spot.zone)
              const active = selected?.id === spot.id
              return (
                <g key={spot.id}>
                  <circle
                    cx={spot.x}
                    cy={spot.y}
                    r={active ? 15 : 11}
                    fill={
                      spot.zone === 'casita'
                        ? 'var(--color-pool)'
                        : spot.zone === 'gazebo'
                          ? 'var(--color-brick)'
                          : 'var(--color-stone)'
                    }
                    opacity={dim ? 0.4 : 1}
                    stroke="var(--color-night)"
                    strokeWidth="3"
                  />
                  {/* The tappable target is deliberately much larger than the
                      dot — this has to work with a thumb on a phone. */}
                  <circle
                    cx={spot.x}
                    cy={spot.y}
                    r="26"
                    fill="transparent"
                    className="cursor-pointer"
                    tabIndex={0}
                    role="button"
                    aria-label={`${spot.label}. ${spot.blurb}`}
                    aria-pressed={active}
                    onClick={() => setSelected(active ? null : spot)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setSelected(active ? null : spot)
                      }
                    }}
                  />
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* --- selected hotspot --------------------------------------------- */}
      {selected && (
        <div className="flex flex-wrap items-start gap-5 border-x border-night-edge bg-night px-5 py-5">
          {photos[selected.photo] && (
            <picture>
              <source type="image/avif" srcSet={photos[selected.photo].avif} sizes="200px" />
              <source type="image/webp" srcSet={photos[selected.photo].webp} sizes="200px" />
              <img
                src={photos[selected.photo].fallback}
                alt={photos[selected.photo].alt}
                width={photos[selected.photo].width}
                height={photos[selected.photo].height}
                className="h-32 w-44 rounded-lg object-cover"
              />
            </picture>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg">{selected.label}</h3>
            <p className="mt-1 text-sm text-stone">{selected.blurb}</p>
          </div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="rounded-full border border-stone/40 px-4 py-1.5 text-sm text-paper hover:border-stone"
          >
            Close
          </button>
        </div>
      )}

      {/* --- availability -------------------------------------------------- */}
      <div className="rounded-b-2xl border border-night-edge bg-night-raised">
        {error && (
          <p role="alert" className="border-b border-night-edge px-5 py-3 text-sm text-brick-lift">
            {error}
          </p>
        )}
        {units.map((unit) => (
          <div
            key={unit.unitId}
            className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-night-edge px-5 py-4 last:border-b-0"
          >
            <p
              className={`w-32 font-display text-sm ${unit.unitId === 'casita' ? 'text-pool' : 'text-brick'}`}
            >
              {UNIT_NAME[unit.unitId]}
            </p>

            <ul className="flex flex-1 flex-wrap gap-x-6 gap-y-2">
              {unit.slots.map((slot) => (
                <li key={slot.package} className="min-w-[8.5rem]">
                  <p className="eyebrow">{slot.label}</p>
                  <p className="font-data text-xs text-stone">
                    {slot.checkIn} – {slot.checkOut}
                  </p>
                  <p
                    className={`font-data text-sm ${slot.state === 'free' ? 'text-paper' : 'text-stone line-through'}`}
                  >
                    {slot.state === 'free' && slot.price !== null
                      ? peso(slot.price)
                      : STATE_TEXT[slot.state]}
                  </p>
                </li>
              ))}
            </ul>

            {unit.anyFree ? (
              <Link
                href={`/book?unit=${unit.unitId}&date=${date}&guests=${guests}`}
                className={`rounded-full px-5 py-2.5 text-sm font-medium text-paper ${unit.unitId === 'casita' ? 'bg-pool' : 'bg-brick'}`}
              >
                Book this
              </Link>
            ) : (
              <p className="text-sm text-stone">Nothing free on this date</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
