'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * There is no consumer API for GCash, Maya or BPI, so proof of payment is a
 * screenshot and a human decision. This takes the screenshot; the owner sees it
 * in admin with a confirm or reject button, and the dates stay held meanwhile.
 */
export function PaymentProofForm({ reference, amount }: { reference: string; amount: number }) {
  const router = useRouter()
  const [method, setMethod] = useState<'GCASH' | 'MAYA' | 'BPI'>('GCASH')
  const [payerReference, setPayerReference] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!file) {
      setError('Attach a photo of your receipt.')
      return
    }
    setError(null)
    setSending(true)

    const body = new FormData()
    body.set('reference', reference)
    body.set('method', method)
    body.set('payerReference', payerReference)
    body.set('proof', file)

    try {
      const response = await fetch('/api/payments/proof', { method: 'POST', body })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? 'That upload did not go through.')
        return
      }
      router.refresh()
    } catch {
      setError('We could not reach the resort just now. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <h3 className="font-display text-base">Upload your receipt</h3>
      <p className="mt-1 text-sm text-stone">
        A screenshot of the ₱{amount.toLocaleString('en-PH')} transfer is all we need.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(['GCASH', 'MAYA', 'BPI'] as const).map((option) => (
          <label
            key={option}
            className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors ${
              method === option ? 'border-pool bg-night text-paper' : 'border-night-edge text-stone'
            }`}
          >
            <input
              type="radio"
              name="method"
              className="sr-only"
              checked={method === option}
              onChange={() => setMethod(option)}
            />
            {option === 'GCASH' ? 'GCash' : option === 'MAYA' ? 'Maya' : 'BPI'}
          </label>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="payerReference" className="eyebrow block">
            Reference number
          </label>
          <input
            id="payerReference"
            value={payerReference}
            onChange={(event) => setPayerReference(event.target.value)}
            maxLength={80}
            className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 font-data text-sm text-paper"
            placeholder="Optional, but it speeds things up"
          />
        </div>

        <div>
          <label htmlFor="proof" className="eyebrow block">
            Receipt photo
          </label>
          <input
            id="proof"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            required
            className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2 text-sm text-stone file:mr-3 file:rounded-full file:border-0 file:bg-night-edge file:px-3 file:py-1.5 file:text-xs file:text-paper"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-brick-lift">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="mt-5 rounded-full bg-pool px-6 py-3 text-sm font-medium text-paper disabled:opacity-40"
      >
        {sending ? 'Sending…' : 'Send receipt'}
      </button>
    </form>
  )
}
