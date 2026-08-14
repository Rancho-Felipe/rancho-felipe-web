import type { Metadata } from 'next'
import Link from 'next/link'
import { RateTable } from '@/components/rate-table'
import { peso, policy, payment, UNIT_ORDER, getUnit } from '@/lib/content'
import { getSettings } from '@/lib/settings'
import { payMongoConfigured } from '@/lib/payments/paymongo'
import { PaymentAccounts } from '@/components/payment-accounts'
import { toAccounts } from '@/lib/payments/accounts'

export const metadata: Metadata = {
  title: 'Rates',
  description:
    'Whole-unit prices for the Casita and the Gazebo at Rancho Felipe. Day tour, night tour or a 22-hour stay, covering up to 10 guests, with ₱300 per extra guest.',
  alternates: { canonical: '/rates' },
}

/* Rendered per request. Reading the settings is NOT enough on its own — this
   page was prerendered at build time, so it kept serving whatever the answer
   was when the build ran, which meant the account numbers stayed published
   after card payment went live. Whether the resort takes card payments is a
   switch the owner flips in admin, so the page has to ask every time. */
export const dynamic = 'force-dynamic'

export default async function RatesPage() {
  const settings = await getSettings()
  const onlinePaymentReady = settings.paymentMethods.paymongo && payMongoConfigured()

  return (
    <>
      <section className="mx-auto max-w-4xl px-5 pt-14">
        <p className="eyebrow">No hidden extras</p>
        <h1 className="mt-3 text-title font-display">Rates</h1>
        <p className="mt-4 max-w-2xl text-lede text-stone">
          You book the whole unit — pool, rooms and all — not a room in someone else&apos;s
          weekend. Every price below covers up to {policy.guests.includedGuests} guests.
        </p>
      </section>

      {UNIT_ORDER.map((slug) => {
        const unit = getUnit(slug)
        return (
          <section key={slug} className="mx-auto mt-14 max-w-4xl px-5">
            <h2 className={`font-display text-xl ${slug === 'casita' ? 'text-pool' : 'text-brick'}`}>
              {unit.name}
            </h2>
            <div className="mt-5">
              <RateTable unit={slug} />
            </div>
          </section>
        )
      })}

      {/* --- extras --------------------------------------------------------- */}
      <section className="mx-auto mt-16 max-w-4xl px-5">
        <h2 className="text-title font-display">Extras</h2>
        <dl className="mt-6 divide-y divide-stone/15 border-y border-stone/15">
          <Extra
            term="Extra guest"
            price={peso(policy.guests.extraGuestFee)}
            detail={`Each guest past the first ${policy.guests.includedGuests}, aged four and up.`}
          />
          <Extra term="Children three and under" price="Free" detail="They don't count toward the guest total." />
          <Extra
            term="Extra hours, Casita"
            price={`${peso(policy.extension.casita.perHour)} an hour`}
            detail="Only when nobody is booked after you — the site checks before offering it."
          />
          <Extra
            term="Extra hours, Gazebo"
            price={`${peso(policy.extension.gazebo.perHour)} an hour`}
            detail="Same rule."
          />
          <Extra
            term="LPG for cooking"
            price={`${peso(250)} / ${peso(500)}`}
            detail="₱250 for a day or night tour, ₱500 for the 22-hour stay."
          />
          <Extra
            term="Firewood for the bonfire"
            price={peso(250)}
            detail="The bonfire itself is free. This is for the wood, paid to the caretaker."
          />
          <Extra
            term="More than three pets"
            price={peso(400)}
            detail="Up to three pets stay free. Pets are never allowed in the pool."
          />
          <Extra term="Corkage" price="None" detail="Bring your own food and drinks." />
          <Extra term="Security deposit" price="None" detail="Damage is charged if it happens, nothing is held up front." />
        </dl>
      </section>

      {/* --- policies ------------------------------------------------------- */}
      <section id="policies" className="mx-auto mt-16 max-w-4xl px-5 pb-4">
        <h2 className="text-title font-display">Paying and cancelling</h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card title={`${policy.deposit.percent}% to book`}>
            A {policy.deposit.percent}% deposit holds your date. The balance is paid when you
            arrive.
          </Card>
          <Card title="First deposit, first booking">
            Dates go to whoever pays first. No pencil booking.
          </Card>
          <Card title="Not refundable">
            Once the deposit is paid it isn&apos;t returned.
          </Card>
          <Card title="But the date can move">
            Message the resort and your booking moves to another date.
          </Card>
        </div>

        <h3 className="mt-10 font-display text-lg">How to pay</h3>
        {onlinePaymentReady ? (
          /* Card and e-wallet payment is on, so the account numbers come off the
             page. Publishing them alongside would invite a guest to transfer by
             hand to a booking the checkout can settle by itself. */
          <p className="mt-4 text-sm text-stone">
            GCash, Maya, card or QR Ph, on a secure payment page. Pick your date and the deposit is
            paid in the same few minutes — your booking confirms itself, with the receipt emailed to
            you.
          </p>
        ) : (
          <>
            <div className="mt-4">
              <PaymentAccounts accounts={toAccounts(payment.methods)} />
            </div>
            <p className="mt-4 text-sm text-stone">
              Send the deposit, upload the receipt on your booking page, and the resort confirms.
              You get an email either way.
            </p>
          </>
        )}

        <div className="mt-10 rounded-2xl border border-night-edge bg-night-raised p-8">
          <h3 className="font-display text-lg">Ready?</h3>
          <p className="mt-2 text-sm text-stone">
            Pick a date and you&apos;ll see the whole price before anything is held.
          </p>
          <Link
            href="/book"
            className="mt-5 inline-block rounded-full bg-pool px-6 py-3 font-medium text-paper"
          >
            Check availability
          </Link>
        </div>
      </section>
    </>
  )
}

function Extra({ term, price, detail }: { term: string; price: string; detail: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-4">
      <dt className="min-w-[12rem] text-sm text-paper">{term}</dt>
      <dd className="font-data text-sm text-pool-lift">{price}</dd>
      <dd className="w-full text-xs text-stone sm:w-auto sm:flex-1">{detail}</dd>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-night-edge bg-night-raised p-5">
      <h3 className="font-display text-base">{title}</h3>
      <p className="mt-1.5 text-sm text-stone">{children}</p>
    </div>
  )
}

