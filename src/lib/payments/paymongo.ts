/* ---------------------------------------------------------------------------
   PayMongo — automated payment for GCash, Maya, cards and QR Ph.

   API shape confirmed against docs.paymongo.com, not from memory:
     POST https://api.paymongo.com/v1/checkout_sessions   creates a hosted page
     GET  https://api.paymongo.com/v1/checkout_sessions/:id  reads it back
   Auth is HTTP Basic with the secret key as the username and an empty password.
   Amounts are in centavos, so PHP 100.00 is 10000.

   The design decision that matters:

   A webhook is only ever treated as a NUDGE. Nothing is confirmed because a
   POST arrived saying it was paid — the site turns around and asks PayMongo
   directly, with its own secret key, and only confirms if PayMongo says the
   session is paid AND the amount matches what was owed. A forged webhook
   therefore cannot confirm a booking, and a webhook lost in transit cannot
   strand one either, because the guest returning from checkout triggers the
   same verification.

   PayMongo does sign requests with a Paymongo-Signature header, but the exact
   format is not in their public documentation. Rather than guess at a
   verification scheme and rely on it, correctness rests on the re-fetch above,
   which needs no shared secret to be trustworthy.
--------------------------------------------------------------------------- */

const API = 'https://api.paymongo.com/v1'

export class PayMongoError extends Error {}

export function payMongoConfigured(): boolean {
  return Boolean(process.env.PAYMONGO_SECRET_KEY)
}

function authHeader(): string {
  const key = process.env.PAYMONGO_SECRET_KEY
  if (!key) throw new PayMongoError('PAYMONGO_SECRET_KEY is not set.')
  // Secret key as username, empty password.
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`
}

async function call(path: string, init?: RequestInit) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      authorization: authHeader(),
      'content-type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const detail = body?.errors?.[0]?.detail ?? `PayMongo returned ${response.status}`
    throw new PayMongoError(detail)
  }
  return body
}

export interface CheckoutLine {
  name: string
  /** Whole pesos. Converted to centavos here so no caller has to remember. */
  pesos: number
  quantity?: number
  description?: string
}

export interface CreatedCheckout {
  sessionId: string
  checkoutUrl: string
}

/** The methods the resort already accepts, plus cards. Anything switched off in
 *  the PayMongo dashboard simply will not appear on the hosted page. */
const METHODS = ['gcash', 'paymaya', 'card', 'qrph', 'grab_pay']

export async function createCheckout(options: {
  reference: string
  guestEmail: string
  guestName: string
  description: string
  lines: CheckoutLine[]
  successUrl: string
  cancelUrl: string
}): Promise<CreatedCheckout> {
  const body = {
    data: {
      attributes: {
        line_items: options.lines.map((line) => ({
          name: line.name,
          // Centavos. Rounded because a peso amount should never carry
          // fractions this far, and a float here would be a rounding bug that
          // shows up as a one-centavo mismatch weeks later.
          amount: Math.round(line.pesos * 100),
          currency: 'PHP',
          quantity: line.quantity ?? 1,
          ...(line.description ? { description: line.description } : {}),
        })),
        payment_method_types: METHODS,
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
        description: options.description,
        // Our booking reference travels with the payment, so a bank statement
        // and an admin screen can be reconciled by eye.
        reference_number: options.reference,
        send_email_receipt: true,
        show_description: true,
        show_line_items: true,
        customer_email: options.guestEmail,
        billing: { name: options.guestName, email: options.guestEmail },
        metadata: { reference: options.reference },
      },
    },
  }

  const result = await call('/checkout_sessions', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  const sessionId = result?.data?.id
  const checkoutUrl = result?.data?.attributes?.checkout_url
  if (!sessionId || !checkoutUrl) {
    throw new PayMongoError('PayMongo did not return a checkout link.')
  }

  return { sessionId, checkoutUrl }
}

export interface CheckoutState {
  paid: boolean
  /** Whole pesos actually received. */
  amountPaid: number
  reference: string | null
  paymentIds: string[]
}

/**
 * Asks PayMongo what really happened. This is the only thing the site trusts
 * when deciding to confirm a booking.
 */
export async function readCheckout(sessionId: string): Promise<CheckoutState> {
  const result = await call(`/checkout_sessions/${sessionId}`)
  const attributes = result?.data?.attributes ?? {}

  const payments: Array<{ id?: string; attributes?: { status?: string; amount?: number } }> =
    attributes.payments ?? []

  const settled = payments.filter((payment) => payment.attributes?.status === 'paid')
  const centavos = settled.reduce((sum, payment) => sum + (payment.attributes?.amount ?? 0), 0)

  return {
    paid: settled.length > 0 && Boolean(attributes.paid_at),
    amountPaid: Math.round(centavos) / 100,
    reference: attributes.reference_number ?? attributes.metadata?.reference ?? null,
    paymentIds: settled.map((payment) => payment.id).filter((id): id is string => Boolean(id)),
  }
}
