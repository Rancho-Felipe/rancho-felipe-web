import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ensurePayMongoWebhook } from './webhook-setup'

const SITE = 'https://rancho-felipe-web.vercel.app'
const TARGET = `${SITE}/api/payments/paymongo/webhook`
const ALL_EVENTS = ['checkout_session.payment.paid', 'payment.paid', 'payment.failed']

/** Records what was asked of PayMongo so the assertions can be about intent. */
function stubPayMongo(webhooks: Array<{ id: string; url: string; events: string[]; status: string }>) {
  const calls: Array<{ method: string; path: string; body?: unknown }> = []

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = url.replace('https://api.paymongo.com/v1', '')
      const method = init?.method ?? 'GET'
      calls.push({ method, path, body: init?.body ? JSON.parse(String(init.body)) : undefined })

      if (method === 'GET' && path === '/webhooks') {
        return Response.json({
          data: webhooks.map((hook) => ({
            id: hook.id,
            attributes: { url: hook.url, events: hook.events, status: hook.status },
          })),
        })
      }

      return Response.json({
        data: { id: 'hook_new', attributes: { url: TARGET, events: ALL_EVENTS, status: 'enabled' } },
      })
    }),
  )

  return calls
}

beforeEach(() => {
  process.env.PAYMONGO_SECRET_KEY = 'sk_test_pretend'
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.PAYMONGO_SECRET_KEY
})

describe('keeping PayMongo pointed at this site', () => {
  it('creates one when the account has none', async () => {
    const calls = stubPayMongo([])

    const outcome = await ensurePayMongoWebhook(SITE)

    expect(outcome.status).toBe('created')
    const created = calls.find((call) => call.method === 'POST')
    expect(created?.body).toEqual({ data: { attributes: { url: TARGET, events: ALL_EVENTS } } })
  })

  /* Duplicates are not harmless: every event would arrive twice and double up
     the audit log, which is the record used to reconcile a disputed payment. */
  it('does not add a second one when this site is already registered', async () => {
    const calls = stubPayMongo([
      { id: 'hook_1', url: TARGET, events: ALL_EVENTS, status: 'enabled' },
    ])

    const outcome = await ensurePayMongoWebhook(SITE)

    expect(outcome.status).toBe('unchanged')
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(0)
  })

  it('adds events that are missing rather than starting again', async () => {
    const calls = stubPayMongo([
      { id: 'hook_1', url: TARGET, events: ['payment.paid'], status: 'enabled' },
    ])

    const outcome = await ensurePayMongoWebhook(SITE)

    expect(outcome.status).toBe('updated')
    const updated = calls.find((call) => call.method === 'PUT')
    expect(updated?.path).toBe('/webhooks/hook_1')
    expect(updated?.body).toEqual({ data: { attributes: { events: ALL_EVENTS } } })
  })

  /* PayMongo disables a webhook after three events exhaust their retries, and
     says nothing. Left alone it reads as payments quietly not confirming. */
  it('switches a disabled webhook back on', async () => {
    const calls = stubPayMongo([
      { id: 'hook_1', url: TARGET, events: ALL_EVENTS, status: 'disabled' },
    ])

    const outcome = await ensurePayMongoWebhook(SITE)

    expect(outcome.status).toBe('reenabled')
    expect(calls.some((call) => call.path === '/webhooks/hook_1/enable')).toBe(true)
  })

  it('leaves somebody else’s webhook alone', async () => {
    const calls = stubPayMongo([
      { id: 'hook_other', url: 'https://another-site.test/hook', events: ALL_EVENTS, status: 'enabled' },
    ])

    const outcome = await ensurePayMongoWebhook(SITE)

    expect(outcome.status).toBe('created')
    expect(calls.some((call) => call.path.includes('hook_other'))).toBe(false)
  })

  it('does nothing at all without a key', async () => {
    delete process.env.PAYMONGO_SECRET_KEY
    const calls = stubPayMongo([])

    const outcome = await ensurePayMongoWebhook(SITE)

    expect(outcome.status).toBe('skipped')
    expect(calls).toHaveLength(0)
  })

  /* PayMongo cannot deliver to http or localhost. Registering one anyway
     creates a webhook that can only ever fail, and failures disable it. */
  it('refuses an address PayMongo could never reach', async () => {
    const calls = stubPayMongo([])

    const outcome = await ensurePayMongoWebhook('http://localhost:3007')

    expect(outcome.status).toBe('skipped')
    expect(calls).toHaveLength(0)
  })

  it('reports a refusal instead of throwing into the caller', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ errors: [{ detail: 'Invalid API key' }] }, { status: 401 })),
    )

    const outcome = await ensurePayMongoWebhook(SITE)

    expect(outcome.status).toBe('failed')
    if (outcome.status === 'failed') expect(outcome.error).toContain('Invalid API key')
  })
})
