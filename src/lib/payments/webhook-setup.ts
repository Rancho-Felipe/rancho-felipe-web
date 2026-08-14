/* Keeps PayMongo pointed at this site, without a person in the loop.
 *
 * PayMongo has no webhook screen — webhooks exist only through its API — so
 * registering one has always meant somebody running a command with the secret
 * key in hand. The server already holds that key, so it can do it itself.
 *
 * Two failure modes this closes:
 *
 *  - Nobody remembers to register the webhook after the key goes in, and
 *    payments settle only when a guest happens to return from checkout.
 *  - PayMongo disables a webhook after three events exhaust their retries. It
 *    does this quietly. Payments then stop confirming and nothing announces it.
 *    Running on a schedule means a disabled webhook comes back on its own.
 *
 * Safe to call repeatedly: it looks before it creates. Duplicates are not
 * harmless — each event would arrive twice and double up the audit log, which
 * is the record you reach for when reconciling a disputed payment. */

const API = 'https://api.paymongo.com/v1'

/* checkout_session.payment.paid is the one hosted checkout actually fires;
   the other two are kept because the handler resolves a booking from any of
   them and the extra coverage costs nothing. */
const EVENTS = ['checkout_session.payment.paid', 'payment.paid', 'payment.failed']

export type WebhookOutcome =
  | { status: 'skipped'; reason: string }
  | { status: 'created' | 'updated' | 'reenabled' | 'unchanged'; id: string; url: string }
  | { status: 'failed'; error: string }

interface Webhook {
  id: string
  attributes: { url: string; events: string[]; status: string }
}

async function call(path: string, init?: RequestInit) {
  const key = process.env.PAYMONGO_SECRET_KEY
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail =
      (body?.errors as Array<{ detail?: string }> | undefined)
        ?.map((error) => error.detail)
        .join('; ') || response.statusText
    throw new Error(`${response.status} ${detail}`)
  }
  return body
}

let started: Promise<WebhookOutcome> | null = null

/**
 * The same check, at most once per server instance.
 *
 * Called when a guest starts a checkout, so the webhook exists before the first
 * payment can ever fire — waiting for the nightly run would leave a day in
 * which payments settle only when a guest happens to return from checkout.
 * Cached because a guest is waiting on that request and two extra API calls per
 * checkout buy nothing after the first.
 */
export function ensurePayMongoWebhookOnce(): Promise<WebhookOutcome> {
  started ??= ensurePayMongoWebhook()
  return started
}

export async function ensurePayMongoWebhook(siteUrl?: string): Promise<WebhookOutcome> {
  // Checked inline rather than through paymongo.ts. This module is also run
  // straight from the command line by tsx, which resolves relative paths but
  // not the @/ alias, and one implementation shared by the server and the
  // command is worth more than reusing a one-line helper.
  if (!process.env.PAYMONGO_SECRET_KEY) {
    return { status: 'skipped', reason: 'PAYMONGO_SECRET_KEY is not set' }
  }

  const base = siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL
  if (!base?.startsWith('https://')) {
    // PayMongo will not deliver to http or to localhost, and registering such a
    // URL creates a webhook that can only ever fail.
    return { status: 'skipped', reason: `site address is not https: ${base ?? 'unset'}` }
  }

  const target = `${base.replace(/\/$/, '')}/api/payments/paymongo/webhook`

  try {
    const listed = (await call('/webhooks')) as { data?: Webhook[] }
    const existing = (listed.data ?? []).find((hook) => hook.attributes?.url === target)

    if (!existing) {
      const created = (await call('/webhooks', {
        method: 'POST',
        body: JSON.stringify({ data: { attributes: { url: target, events: EVENTS } } }),
      })) as { data: Webhook }
      return { status: 'created', id: created.data.id, url: target }
    }

    if (EVENTS.some((event) => !existing.attributes.events.includes(event))) {
      const updated = (await call(`/webhooks/${existing.id}`, {
        method: 'PUT',
        body: JSON.stringify({ data: { attributes: { events: EVENTS } } }),
      })) as { data: Webhook }
      return { status: 'updated', id: updated.data.id, url: target }
    }

    if (existing.attributes.status !== 'enabled') {
      const enabled = (await call(`/webhooks/${existing.id}/enable`, { method: 'POST' })) as {
        data: Webhook
      }
      return { status: 'reenabled', id: enabled.data.id, url: target }
    }

    return { status: 'unchanged', id: existing.id, url: target }
  } catch (cause) {
    return { status: 'failed', error: String(cause) }
  }
}
