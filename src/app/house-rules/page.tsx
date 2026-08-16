import type { Metadata } from 'next'
import Link from 'next/link'
import { getSettings } from '@/lib/settings'
import { houseRulesForGuests } from '@/lib/email/notify'
import { policy } from '@/lib/content'

export const metadata: Metadata = {
  title: 'House Rules — Videoke, Pets, Pool & Bonfire',
  description:
    'House rules for Rancho Felipe: videoke hours, pets, the pool, bonfires, parking and checking out.',
  alternates: { canonical: '/house-rules' },
}

export const dynamic = 'force-dynamic'

export default async function HouseRulesPage() {
  const settings = await getSettings()
  // The same list the guest gets emailed on confirmation, so the page and the
  // email can never drift apart.
  const rules = houseRulesForGuests(settings.videokeCurfew)

  return (
    <>
      <section className="mx-auto max-w-3xl px-5 pt-14">
        <p className="eyebrow">The short version</p>
        <h1 className="mt-3 text-title font-display">House rules</h1>
        <p className="mt-4 text-lede text-stone">
          The farm is yours while you&apos;re here. These are the few things that keep it that way
          for the next group.
        </p>
      </section>

      <section className="mx-auto mt-10 max-w-3xl px-5">
        <ul className="divide-y divide-stone/15 border-y border-stone/15">
          {rules.map((rule) => (
            <li key={rule} className="flex gap-4 py-4">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pool" />
              <span className="text-sm text-paper">{rule}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-12 max-w-3xl px-5">
        <h2 className="font-display text-xl">Is it safe?</h2>
        <p className="mt-3 text-sm text-stone">{policy.security.$copy}</p>
      </section>

      <section className="mx-auto mt-12 max-w-3xl px-5 pb-4">
        <h2 className="font-display text-xl">If plans change</h2>
        <p className="mt-3 text-sm text-stone">
          The {policy.deposit.percent}% deposit isn&apos;t refundable, but your date can be moved —
          message the resort and it&apos;s reassigned. Dates go to whoever pays first, so nothing is
          held on a promise.
        </p>

        <div className="mt-10 rounded-2xl border border-night-edge bg-night-raised p-8">
          <h3 className="font-display text-lg">Any question not answered here?</h3>
          <p className="mt-2 text-sm text-stone">
            Message the resort on Facebook or call the unit you want. Someone is on the farm.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/getting-here"
              className="rounded-full border border-stone/40 px-6 py-3 text-sm text-paper hover:border-stone"
            >
              Contact and directions
            </Link>
            <Link href="/book" className="rounded-full bg-pool px-6 py-3 text-sm font-medium text-paper">
              Check availability
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
