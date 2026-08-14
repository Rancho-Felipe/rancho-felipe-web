'use client'

import { useState } from 'react'
import type { PaymentAccount } from '@/lib/payments/accounts'

/**
 * Copies text, with a fallback for the browsers this audience actually uses.
 *
 * navigator.clipboard is the right API and it is not enough on its own: it
 * rejects when the document is not focused, and it is missing or blocked in the
 * in-app browsers that open when someone taps a link from the resort's Facebook
 * page — which is how a large share of these guests will arrive. The old
 * execCommand path still works there.
 *
 * Returns whether it worked, so the button never claims a copy that did not
 * happen. The number is on screen regardless, so failing is quiet.
 */
async function writeToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to the older path rather than giving up.
  }

  try {
    const field = document.createElement('textarea')
    field.value = text
    field.setAttribute('readonly', '')
    // Kept on screen but invisible: display:none and visibility:hidden are not
    // selectable, and a field off the top of the page makes iOS scroll to it.
    field.style.position = 'fixed'
    field.style.top = '0'
    field.style.opacity = '0'
    document.body.appendChild(field)
    field.select()
    field.setSelectionRange(0, text.length)
    const copied = document.execCommand('copy')
    document.body.removeChild(field)
    return copied
  } catch {
    return false
  }
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!(await writeToClipboard(value))) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy the ${label} number`}
      /* min-h-11 is 44px: this is tapped with a thumb, on a phone, by someone
         about to move money. The same floor the calendar dates use. */
      className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-night-edge px-4 font-data text-[11px] uppercase tracking-widest text-stone transition-colors hover:border-field hover:text-field focus-visible:border-field focus-visible:text-field"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

/**
 * The account numbers, set as a ledger rather than as cards.
 *
 * The number is the payload — it is what gets carried into a banking app — so
 * it is the largest thing here and it can be copied rather than retyped. A
 * mistyped digit does not bounce; it pays a stranger, and the guest still
 * believes they have booked.
 */
export function PaymentAccounts({
  accounts,
  amount,
}: {
  accounts: PaymentAccount[]
  /** The exact deposit, where it is known. Omitted on pages with no booking. */
  amount?: string
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-night-edge bg-night-raised">
      <div className="h-px w-full bg-field/50" aria-hidden="true" />

      {amount && (
        <p className="border-b hairline px-5 py-3 text-sm text-stone">
          Send exactly <span className="font-data text-paper">{amount}</span> — the amount is how
          the resort matches your payment to your booking.
        </p>
      )}

      <ul className="divide-y divide-[color-mix(in_srgb,var(--color-stone)_18%,transparent)]">
        {accounts.map((account) => (
          <li
            key={account.channels.join('/')}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4"
          >
            <div className="min-w-0 grow">
              <p className="eyebrow">{account.channels.join(' · ')}</p>
              <p className="mt-1 font-data text-lg tracking-tight text-paper sm:text-xl">
                {account.value}
              </p>
              <p className="mt-0.5 text-xs text-stone">{account.name}</p>
            </div>
            <CopyButton value={account.value} label={account.channels.join(' and ')} />
          </li>
        ))}
      </ul>
    </div>
  )
}
