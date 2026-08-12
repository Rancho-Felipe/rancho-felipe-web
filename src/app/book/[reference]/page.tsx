import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getSettings } from '@/lib/settings'
import { inResortTime } from '@/lib/booking/schedule'
import { peso, contact, links } from '@/lib/content'
import { PaymentProofForm } from '@/components/booking/payment-proof-form'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your booking',
  robots: { index: false, follow: false },
}

const STATUS_COPY: Record<string, { headline: string; body: string }> = {
  PENDING: {
    headline: 'We’re holding your date',
    body: 'Send the deposit and upload the receipt below. The date is yours until the hold runs out.',
  },
  AWAITING_VERIFICATION: {
    headline: 'Receipt received',
    body: 'The resort is checking your payment. Your date stays held while they do. You’ll get an email once it’s confirmed.',
  },
  CONFIRMED: {
    headline: 'You’re booked',
    body: 'See you at the farm. Bring the balance on arrival.',
  },
  EXPIRED: {
    headline: 'This hold has expired',
    body: 'The dates were released when the deposit didn’t arrive in time. You can book again, or message the resort.',
  },
  CANCELLED: { headline: 'This booking was cancelled', body: 'Message the resort if that’s a surprise.' },
  REJECTED: {
    headline: 'This booking wasn’t accepted',
    body: 'The resort couldn’t verify the payment. Please message them.',
  },
  COMPLETED: { headline: 'Thanks for staying', body: 'We’d love to have you back.' },
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params

  const booking = await db.booking.findUnique({
    where: { reference: reference.toUpperCase() },
    include: { unit: true, addOns: { include: { addOn: true } }, payments: true },
  })
  if (!booking) notFound()

  const settings = await getSettings()
  const copy = STATUS_COPY[booking.status] ?? STATUS_COPY.PENDING
  const accent = booking.unitId === 'casita' ? 'text-pool' : 'text-brick'
  const lines = booking.breakdown as Array<{ label: string; detail?: string; amount: number }>
  const needsPayment = booking.status === 'PENDING'
  const unitPhone = booking.unitId === 'casita' ? contact.casita.mobile : contact.gazebo.mobile[0]

  return (
    <section className="mx-auto max-w-3xl px-5 py-14">
      <p className="eyebrow">Reference</p>
      <p className="mt-1 font-data text-2xl text-paper">{booking.reference}</p>

      <h1 className="mt-6 text-title font-display">{copy.headline}</h1>
      <p className="mt-3 text-lede text-stone">{copy.body}</p>

      {booking.status === 'PENDING' && booking.holdExpiresAt && (
        <p className="mt-4 rounded-lg border border-night-edge bg-night-raised px-4 py-3 text-sm text-stone">
          Held until{' '}
          <span className="font-data text-paper">{inResortTime(booking.holdExpiresAt)}</span>. After
          that the date goes back on sale.
        </p>
      )}

      {/* --- what was booked --------------------------------------------- */}
      <div className="mt-10 rounded-2xl border border-night-edge bg-night-raised p-6">
        <h2 className={`font-display text-lg ${accent}`}>{booking.unit.name}</h2>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Detail label="Check in" value={inResortTime(booking.checkInAt)} />
          <Detail label="Check out" value={inResortTime(booking.checkOutAt)} />
          <Detail
            label="Guests"
            value={`${booking.paxTotal}${booking.paxUnder4 > 0 ? ` (${booking.paxUnder4} under 4, free)` : ''}`}
          />
          <Detail label="Name" value={booking.guestName} />
          <Detail label="Contact" value={booking.guestPhone} />
          <Detail label="Email" value={booking.guestEmail} />
          {booking.pets > 0 && <Detail label="Pets" value={String(booking.pets)} />}
          {booking.extensionHours > 0 && (
            <Detail label="Extra hours" value={`${booking.extensionHours}`} />
          )}
        </dl>

        {booking.guestNote && (
          <p className="mt-5 border-t hairline pt-4 text-sm text-stone">
            <span className="eyebrow block">Your note</span>
            {booking.guestNote}
          </p>
        )}

        <dl className="mt-6 space-y-2.5 border-t hairline pt-4">
          {lines.map((line, index) => (
            <div key={index} className="flex items-start justify-between gap-4">
              <dt className="text-sm text-stone">
                {line.label}
                {line.detail && <span className="block text-xs text-stone/70">{line.detail}</span>}
              </dt>
              <dd className="font-data text-sm text-paper">{peso(line.amount)}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 space-y-2 border-t hairline pt-4">
          <Row label="Total" value={peso(booking.total)} strong />
          <Row
            label={booking.status === 'CONFIRMED' ? 'Deposit paid' : `Deposit (${settings.depositPercent}%)`}
            value={peso(booking.depositDue)}
          />
          <Row label="Balance on arrival" value={peso(booking.balanceDue)} />
        </div>
      </div>

      {/* --- how to pay ---------------------------------------------------- */}
      {needsPayment && (
        <div className="mt-8 rounded-2xl border border-night-edge bg-night-raised p-6">
          <h2 className="font-display text-lg">Send {peso(booking.depositDue)} to hold it</h2>
          <p className="mt-2 text-sm text-stone">
            Any of these. Then upload the receipt below and the resort will confirm.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {settings.paymentMethods.gcash && (
              <PayBox
                label="GCash"
                lines={[settings.bankDetails.gcash.number, settings.bankDetails.gcash.name]}
              />
            )}
            {settings.paymentMethods.maya && (
              <PayBox
                label="Maya"
                lines={[settings.bankDetails.maya.number, settings.bankDetails.maya.name]}
              />
            )}
            {settings.paymentMethods.bpi && (
              <PayBox
                label="BPI"
                lines={[settings.bankDetails.bpi.account, settings.bankDetails.bpi.name]}
              />
            )}
          </div>

          <p className="mt-5 rounded-lg bg-night px-4 py-3 text-xs text-stone">
            The deposit is not refundable, but your date can be moved. First deposit, first
            reservation — no pencil booking.
          </p>

          <div className="mt-6 border-t hairline pt-6">
            <PaymentProofForm reference={booking.reference} amount={booking.depositDue} />
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <a href={`tel:${unitPhone.replace(/-/g, '')}`} className="text-pool-lift underline underline-offset-4">
          Call the resort · {unitPhone}
        </a>
        <a
          href={links.facebook}
          target="_blank"
          rel="noreferrer"
          className="text-stone underline underline-offset-4 hover:text-paper"
        >
          Message on Facebook
        </a>
      </div>
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 font-data text-sm text-paper">{value}</dd>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={`text-sm ${strong ? 'text-paper' : 'text-stone'}`}>{label}</span>
      <span className={`font-data ${strong ? 'text-base text-paper' : 'text-sm text-stone'}`}>
        {value}
      </span>
    </div>
  )
}

function PayBox({ label, lines }: { label: string; lines: string[] }) {
  return (
    <div className="rounded-xl border border-night-edge bg-night p-4">
      <p className="eyebrow">{label}</p>
      {lines.map((line, index) => (
        <p key={index} className={index === 0 ? 'mt-1.5 font-data text-sm text-paper' : 'text-xs text-stone'}>
          {line}
        </p>
      ))}
    </div>
  )
}
