import { peso, policy } from '@/lib/content'

/* The four things every enquiry asks before anything else: how many of us fit,
 * what does it start at, how far is it, and do we share it. They are scattered
 * across four pages; this puts them in one line near the top.
 *
 * Numbers come from content/policy.json, so the strip cannot quietly disagree
 * with the rates page. The lowest figure across both units is the honest "from"
 * price — quoting the Casita's ₱6,000 here would be a bait. */

const LOWEST = Math.min(policy.pricing.casita.dayTour, policy.pricing.gazebo.dayTour)

function PoolMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <path d="M2 17c2 0 2 1.6 4 1.6S8 17 10 17s2 1.6 4 1.6S16 17 18 17s2 1.6 4 1.6" />
      <path d="M7 14V5.5A2 2 0 0 1 11 5.5V14M17 14V5.5A2 2 0 0 0 13 5.5V14M7 9h10" />
    </svg>
  )
}

function GuestsMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M16 5.4a3.2 3.2 0 0 1 0 5.2M18 14.9c2 .8 3.4 2.7 3.4 5.1" />
    </svg>
  )
}

function RoadMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <path d="M8 3 5 21M16 3l3 18" />
      <path d="M12 4v3M12 10.5v3M12 17v3" />
    </svg>
  )
}

function GateMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 21V9l8-5.5L20 9v12" />
      <path d="M9.5 21v-6.5h5V21" />
    </svg>
  )
}

const STATS = [
  {
    key: 'pools',
    Mark: PoolMark,
    value: 'Two pools',
    label: 'One for the Casita, one for the Gazebo',
  },
  {
    key: 'guests',
    Mark: GuestsMark,
    value: `${policy.guests.includedGuests} pax included`,
    label: `${peso(policy.guests.extraGuestFee)} for each one after that`,
  },
  {
    key: 'distance',
    Mark: RoadMark,
    value: 'An hour out',
    label: 'From Metro Manila to Teresa, Rizal',
  },
  {
    key: 'exclusive',
    Mark: GateMark,
    value: `From ${peso(LOWEST)}`,
    label: 'The whole place, one group at a time',
  },
]

export function FarmAtAGlance({ className = '' }: { className?: string }) {
  return (
    <dl
      className={`reveal-stagger grid gap-px overflow-hidden rounded-2xl border border-night-edge bg-night-edge sm:grid-cols-2 lg:grid-cols-4 ${className}`}
    >
      {STATS.map(({ key, Mark, value, label }) => (
        <div key={key} className="flex gap-3.5 bg-night-raised p-5">
          <span className="mt-0.5 h-5 w-5 shrink-0 text-pool">
            <Mark />
          </span>
          <div className="min-w-0">
            <dt className="font-display text-base text-paper">{value}</dt>
            <dd className="mt-1 text-xs leading-snug text-stone">{label}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}
