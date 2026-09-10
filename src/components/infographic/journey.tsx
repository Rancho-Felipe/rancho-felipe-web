import { directions } from '@/lib/content'

/* Both routes as a pair of steppers rather than two bullet lists, because the
 * question underneath "how do I get there" is really "how many moves is this,
 * and where do I turn". A numbered spine answers that at a glance; prose does
 * not.
 *
 * Steps come from content/manifest.json exactly as the owner gave them. The
 * landmark is pulled out separately because on a rough road with no signage it
 * is the only thing anyone can actually navigate by. */

function CarMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 13.5 4.8 8a2 2 0 0 1 1.9-1.4h10.6A2 2 0 0 1 19.2 8L21 13.5" />
      <path d="M3 13.5h18V18a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1h-11v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M6.5 16h.01M17.5 16h.01" />
    </svg>
  )
}

function JeepMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 16V9a1 1 0 0 1 1-1h13.2a2 2 0 0 1 1.6.8L21 12.5V16" />
      <path d="M2 16h20" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
      <path d="M6 8v4M11 8v4M16 9.5v2.5" />
    </svg>
  )
}

const ROUTES = [
  {
    key: 'car',
    Mark: CarMark,
    label: 'By car',
    tone: 'text-pool',
    rail: 'bg-pool/35',
    dot: 'border-pool',
    steps: directions.byCar,
    // Carried over from the prose this replaced. It is the reassurance the car
    // route actually needs — "rough road" reads as "we might not make it".
    note: 'The last stretch is rough road, but every vehicle gets through — cars and vans included.',
  },
  {
    key: 'commute',
    Mark: JeepMark,
    label: 'By jeepney',
    tone: 'text-brick',
    rail: 'bg-brick/35',
    dot: 'border-brick',
    steps: directions.byCommute,
    note: null,
  },
]

export function Journey({ className = '' }: { className?: string }) {
  return (
    <div className={`reveal ${className}`}>
      <div className="grid gap-8 sm:grid-cols-2 sm:gap-10">
        {ROUTES.map(({ key, Mark, label, tone, rail, dot, steps, note }) => (
          <section key={key} aria-label={label}>
            <h3 className={`flex items-center gap-2.5 font-display text-base ${tone}`}>
              <span className="h-5 w-5 shrink-0">
                <Mark />
              </span>
              {label}
            </h3>

            <ol className="relative mt-5 space-y-5">
              {/* The spine. Stops short of the last marker so the route reads as
                  arriving somewhere rather than continuing past it. */}
              <span
                aria-hidden="true"
                className={`absolute top-3 bottom-8 left-[11px] w-px ${rail}`}
              />
              {steps.map((step: string, i: number) => (
                <li key={step} className="relative flex gap-4">
                  <span
                    aria-hidden="true"
                    className={`z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border bg-night font-data text-[10px] text-paper ${dot}`}
                  >
                    {i + 1}
                  </span>
                  <p className="pt-0.5 text-sm leading-relaxed text-stone">{step}</p>
                </li>
              ))}
            </ol>

            {note && <p className="mt-4 text-xs leading-relaxed text-stone/85">{note}</p>}
          </section>
        ))}
      </div>

      <p className="mt-8 flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-xl border border-night-edge bg-night-raised px-4 py-3 text-sm">
        <span className="eyebrow">Look for</span>
        <span className="text-paper">{directions.landmark}</span>
        <span className="text-xs text-stone">— the turn has no sign, so this is the marker.</span>
      </p>
    </div>
  )
}
