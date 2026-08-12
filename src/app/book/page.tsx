import type { Metadata } from 'next'
import { BookingForm } from '@/components/booking/booking-form'
import { firstBookableDate } from '@/lib/booking/availability'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Check availability',
  description:
    'Pick a date and a check-in method for the Casita or the Gazebo at Rancho Felipe. You see the full price before you pay anything.',
  alternates: { canonical: '/book' },
  robots: { index: false, follow: true },
}

export const dynamic = 'force-dynamic'

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string; date?: string; guests?: string }>
}) {
  const params = await searchParams
  const today = firstBookableDate()

  const unit = params.unit === 'gazebo' ? 'gazebo' : 'casita'
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? '') ? params.date! : today
  const guests = Math.min(60, Math.max(1, Number(params.guests) || 10))

  const units = await db.unit.findMany({ select: { id: true, extensionRate: true } })
  const extensionRates = Object.fromEntries(
    units.map((u) => [u.id, u.extensionRate]),
  ) as Record<'casita' | 'gazebo', number>

  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <p className="eyebrow">One group at a time</p>
      <h1 className="mt-3 text-title font-display">Check availability</h1>
      <p className="mt-4 max-w-2xl text-lede text-stone">
        Pick a date and how you want to check in. You&apos;ll see the whole price before anything is
        held, and nothing is charged on this page.
      </p>

      <div className="mt-12">
        <BookingForm
          initialUnit={unit}
          initialDate={date < today ? today : date}
          initialGuests={guests}
          minDate={today}
          extensionRates={extensionRates}
        />
      </div>
    </section>
  )
}
