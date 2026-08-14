'use client'

import { useState } from 'react'

/**
 * Sends the guest to PayMongo's hosted page.
 *
 * The amount is never sent from here — the server reads it off the booking. All
 * this does is ask for a link and follow it, so there is nothing in the browser
 * worth tampering with.
 */
export function PayOnlineButton({ reference, amount }: { reference: string; amount: number }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function go() {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/payments/paymongo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reference }),
      })
      const data = await response.json()

      if (!response.ok || !data.checkoutUrl) {
        setError(data.error ?? 'Could not open the payment page.')
        setBusy(false)
        return
      }
      window.location.href = data.checkoutUrl
    } catch {
      setError('We could not reach the payment page. You can still send the deposit manually below.')
      setBusy(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className="w-full rounded-full bg-field px-6 py-3.5 font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
      >
        {busy ? 'Opening…' : `Pay ₱${amount.toLocaleString('en-PH')} now`}
      </button>
      <p className="mt-2 text-xs text-stone">
        GCash, Maya, card or QR Ph. Your booking confirms by itself the moment it goes through — no
        screenshot, no waiting.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-brick-lift">
          {error}
        </p>
      )}
    </div>
  )
}
