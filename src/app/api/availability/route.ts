import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAvailability, getDayView } from '@/lib/booking/availability'
import { rateLimit } from '@/lib/rate-limit'

/* Availability is read straight from the database on every request. It is never
   cached and never precomputed — a stale calendar is how a resort ends up with
   two groups on the same date. */
export const dynamic = 'force-dynamic'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a yyyy-mm-dd date.')

const monthQuery = z.object({
  mode: z.literal('range'),
  unit: z.enum(['casita', 'gazebo']),
  from: isoDate,
  to: isoDate,
})

const dayQuery = z.object({
  mode: z.literal('day'),
  date: isoDate,
  guests: z.coerce.number().int().min(1).max(60).default(10),
})

export async function GET(request: Request) {
  const limited = await rateLimit(request, { key: 'availability', limit: 60, windowMs: 60_000 })
  if (limited) return limited

  const params = Object.fromEntries(new URL(request.url).searchParams)

  if (params.mode === 'day' || (params.date && !params.unit)) {
    const parsed = dayQuery.safeParse({ ...params, mode: 'day' })
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const units = await getDayView(parsed.data.date, parsed.data.guests)
    return NextResponse.json({ date: parsed.data.date, units })
  }

  const parsed = monthQuery.safeParse({ ...params, mode: 'range' })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  // A window this wide is plenty for a month view and stops anyone using the
  // endpoint to dump the whole calendar.
  const span =
    (Date.parse(parsed.data.to) - Date.parse(parsed.data.from)) / 86_400_000
  if (span < 0 || span > 92) {
    return NextResponse.json(
      { error: 'Ask for a range of 92 days or fewer.' },
      { status: 400 },
    )
  }

  const days = await getAvailability({
    unitId: parsed.data.unit,
    from: parsed.data.from,
    to: parsed.data.to,
  })

  return NextResponse.json({ unit: parsed.data.unit, days })
}
