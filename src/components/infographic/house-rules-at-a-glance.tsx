import { peso, policy } from '@/lib/content'

/* The rules list is short and worth reading. This sits above it and answers the
 * four things people were actually going to ask anyway: how late can we be
 * loud, can we bring the dog, is there a deposit, and is it safe.
 *
 * The curfew is drawn rather than written because a time on a dial is read
 * faster than a time in a sentence, and because it is the single rule most
 * likely to decide whether a group books at all. It is passed in from settings
 * rather than read from policy.json: the owner can change it in admin, and the
 * file still carries the original "till 2pm" ambiguity that setting resolved. */

function clockAngles(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return { hour: ((h % 12) + m / 60) * 30, minute: m * 6 }
}

function label12(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h < 12 ? 'AM' : 'PM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}${m ? `:${String(m).padStart(2, '0')}` : ''}:00 ${suffix}`.replace(':00:00', ':00')
}

function CurfewClock({ curfew }: { curfew: string }) {
  const { hour, minute } = clockAngles(curfew)

  return (
    <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0" role="img" aria-label={`Clock showing ${label12(curfew)}`}>
      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-night-edge" />
      {/* Twelve ticks, longer at the quarters. */}
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          x1="50"
          y1="9"
          x2="50"
          y2={i % 3 === 0 ? 17 : 13}
          stroke="currentColor"
          strokeWidth={i % 3 === 0 ? 2.4 : 1.4}
          strokeLinecap="round"
          className="text-stone/50"
          transform={`rotate(${i * 30} 50 50)`}
        />
      ))}
      <line
        x1="50" y1="50" x2="50" y2="28"
        stroke="currentColor" strokeWidth="4" strokeLinecap="round"
        className="text-pool" transform={`rotate(${hour} 50 50)`}
      />
      <line
        x1="50" y1="50" x2="50" y2="18"
        stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"
        className="text-pool-lift" transform={`rotate(${minute} 50 50)`}
      />
      <circle cx="50" cy="50" r="3.2" fill="currentColor" className="text-paper" />
    </svg>
  )
}

export function HouseRulesAtAGlance({
  videokeCurfew,
  className = '',
}: {
  videokeCurfew: string
  className?: string
}) {
  const facts = [
    {
      key: 'pets',
      value: `Up to ${policy.pets.freeMaximum} pets free`,
      note: `${peso(policy.pets.overageFee)} beyond that. Never in the pool.`,
    },
    {
      key: 'corkage',
      value: policy.fees.corkage === 0 ? 'No corkage' : peso(policy.fees.corkage),
      note: 'Bring your own food and drinks.',
    },
    {
      key: 'deposit',
      value: policy.fees.securityDeposit === 0 ? 'No security deposit' : peso(policy.fees.securityDeposit),
      note: 'Damage is charged if it happens, nothing is held up front.',
    },
    {
      key: 'security',
      value: 'Gated, with CCTV',
      note: 'Caretakers are on site throughout your stay.',
    },
  ]

  return (
    <div className={`reveal grid gap-6 rounded-2xl border border-night-edge bg-night-raised p-6 sm:grid-cols-[auto_1fr] sm:gap-8 sm:p-7 ${className}`}>
      <div className="flex items-center gap-5 sm:flex-col sm:items-start sm:gap-3">
        <CurfewClock curfew={videokeCurfew} />
        <div>
          <p className="eyebrow">Videoke until</p>
          <p className="mt-1 font-display text-xl text-paper">{label12(videokeCurfew)}</p>
        </div>
      </div>

      <dl className="reveal-stagger grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {facts.map((fact) => (
          <div key={fact.key}>
            <dt className="text-sm text-paper">{fact.value}</dt>
            <dd className="mt-0.5 text-xs leading-snug text-stone">{fact.note}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
