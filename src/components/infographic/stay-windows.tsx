import { schedule } from '@/lib/content'

/* Three package names and six clock times, which is a paragraph nobody reads
   and a table nobody pictures. The thing people are actually working out is
   whether they sleep over and how much of a day they get — and that is a shape,
   not a number.
 *
 * The axis runs 06:00 on the day you arrive to noon the next day, so the two
 * windows that cross midnight draw as one continuous bar instead of wrapping.
 * Every figure comes from content/policy.json; nothing here is a second copy of
 * the times that could drift out of step with the booking engine. */

const AXIS_START = 6 // 06:00, the day you arrive
const AXIS_END = 36 // 12:00, the following day
const SPAN = AXIS_END - AXIS_START

function toHours(clock: string) {
  const [h, m] = clock.split(':').map(Number)
  return h + m / 60
}

function pct(hours: number) {
  return ((hours - AXIS_START) / SPAN) * 100
}

type Row = {
  key: string
  label: string
  window: { in: string; out: string; hours: number; endsNextDay?: boolean }
  /* Daylight green, night blue, and a bar that crosses from one into the other
     for the stay that spans both. The colour is carrying the same information
     as the position, which is the point. */
  fill: string
  note: string
}

const ROWS: Row[] = [
  {
    key: 'dayTour',
    label: 'Day tour',
    window: schedule.dayTour,
    fill: 'linear-gradient(90deg, var(--color-field), var(--color-field-lift))',
    note: 'Daylight, no overnight',
  },
  {
    key: 'nightTour',
    label: 'Night tour',
    window: schedule.nightTour,
    fill: 'linear-gradient(90deg, var(--color-pool-deep), var(--color-pool))',
    note: 'Sleep over, out early',
  },
  {
    key: 'fullStay',
    label: '22 hours',
    window: schedule.fullStay,
    fill: 'linear-gradient(90deg, var(--color-field), var(--color-pool-deep))',
    note: 'An afternoon, a night and a morning',
  },
]

const TICKS = [
  { at: 6, label: '6am' },
  { at: 12, label: 'noon' },
  { at: 18, label: '6pm' },
  { at: 24, label: 'midnight' },
  { at: 30, label: '6am' },
  { at: 36, label: 'noon' },
]

export function StayWindows({ className = '' }: { className?: string }) {
  return (
    <figure className={`reveal ${className}`}>
      <figcaption className="eyebrow">How long each one lasts</figcaption>

      <div className="mt-5 space-y-4">
        {ROWS.map((row) => {
          const start = toHours(row.window.in)
          const end = toHours(row.window.out) + (row.window.endsNextDay ? 24 : 0)

          return (
            <div key={row.key} className="grid gap-2 sm:grid-cols-[9rem_1fr] sm:items-center">
              <div className="min-w-0">
                <p className="text-sm text-paper">{row.label}</p>
                <p className="font-data text-xs text-stone">
                  {row.window.in}
                  {' – '}
                  {row.window.out}
                  {row.window.endsNextDay ? ' next day' : ''}
                </p>
              </div>

              <div className="relative h-9">
                {/* The track, and the midnight rule drawn across it. */}
                <div className="absolute inset-0 rounded-sm bg-night-edge/60" />
                <div
                  className="absolute top-0 bottom-0 w-px bg-stone/30"
                  style={{ left: `${pct(24)}%` }}
                  aria-hidden="true"
                />

                <div
                  className="stay-bar absolute top-0 bottom-0 flex items-center rounded-sm px-2.5"
                  style={{
                    left: `${pct(start)}%`,
                    width: `${pct(end) - pct(start)}%`,
                    backgroundImage: row.fill,
                  }}
                >
                  <span className="truncate font-data text-xs font-semibold text-night">
                    {row.window.hours}h
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone sm:col-start-2">{row.note}</p>
            </div>
          )
        })}
      </div>

      {/* The axis. Hidden from assistive tech because the times are already
          written out in full beside every bar above. */}
      <div className="relative mt-4 h-4 sm:ml-[9rem]" aria-hidden="true">
        {TICKS.map((tick) => (
          <span
            key={`${tick.at}-${tick.label}`}
            className="absolute -translate-x-1/2 font-data text-[10px] whitespace-nowrap text-stone/70"
            style={{ left: `${pct(tick.at)}%` }}
          >
            {tick.label}
          </span>
        ))}
      </div>

      <p className="mt-4 max-w-prose text-sm text-stone">
        Same windows for both the Casita and the Gazebo. A {schedule.turnoverMinutes}-minute
        turnover sits either side of every booking, so there is a full hour between one group
        leaving and the next arriving.
      </p>
    </figure>
  )
}
