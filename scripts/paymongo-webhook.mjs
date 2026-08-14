/* Registers this site's webhook with PayMongo.
 *
 *   npm run paymongo:webhook
 *
 * PayMongo has no webhook screen in its dashboard — webhooks exist only through
 * its API — so this is the only way to create one. It reads the secret key from
 * the environment and never prints it.
 *
 * Safe to run repeatedly. It looks for a webhook already pointing at this site
 * before creating one, so a second run reports rather than duplicates. Duplicate
 * webhooks are not harmless: every event would arrive twice, and while settling
 * is idempotent, the audit log would double up and make reconciliation harder to
 * read.
 */
import { readFileSync } from 'node:fs'

/* Read .env without a dependency. Next loads it automatically; a plain node
   script does not. */
function fromEnvFile(key) {
  try {
    const line = readFileSync('.env', 'utf8').match(new RegExp(`^${key}="?([^"\n]*)"?$`, 'm'))
    return line?.[1] || undefined
  } catch {
    return undefined
  }
}

const secret = process.env.PAYMONGO_SECRET_KEY || fromEnvFile('PAYMONGO_SECRET_KEY')
const site =
  process.argv[2] ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  fromEnvFile('NEXT_PUBLIC_SITE_URL')

if (!secret) {
  console.error(
    'PAYMONGO_SECRET_KEY is not set.\n' +
      'Put it in .env (it is git-ignored), or pass it for one run:\n' +
      '  PAYMONGO_SECRET_KEY=sk_live_... npm run paymongo:webhook',
  )
  process.exit(1)
}
if (!site || !site.startsWith('https://')) {
  console.error(
    `The site address must be https, got: ${site ?? '(nothing)'}\n` +
      'PayMongo will not deliver to http or to localhost.\n' +
      '  npm run paymongo:webhook -- https://your-site.vercel.app',
  )
  process.exit(1)
}

const mode = secret.startsWith('sk_live') ? 'LIVE' : 'TEST'
const target = `${site.replace(/\/$/, '')}/api/payments/paymongo/webhook`

/* checkout_session.payment.paid is the one that matters for hosted checkout;
   payment.paid and payment.failed are kept because the handler resolves the
   booking from any of them and more coverage costs nothing. */
const EVENTS = ['checkout_session.payment.paid', 'payment.paid', 'payment.failed']

const auth = `Basic ${Buffer.from(`${secret}:`).toString('base64')}`

async function api(path, init) {
  const response = await fetch(`https://api.paymongo.com/v1${path}`, {
    ...init,
    headers: { authorization: auth, 'content-type': 'application/json', accept: 'application/json' },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = body?.errors?.map((e) => e.detail).join('; ') || response.statusText
    throw new Error(`${response.status} ${detail}`)
  }
  return body
}

function describe(hook) {
  const a = hook.attributes
  return `  id      ${hook.id}\n  url     ${a.url}\n  events  ${a.events.join(', ')}\n  status  ${a.status}\n  mode    ${a.livemode ? 'LIVE' : 'TEST'}`
}

console.log(`PayMongo webhook setup — ${mode} key`)
console.log(`target: ${target}\n`)

const existing = await api('/webhooks')
const match = (existing.data ?? []).find((h) => h.attributes?.url === target)

if (match) {
  console.log('A webhook already points here:')
  console.log(describe(match))

  const missing = EVENTS.filter((e) => !match.attributes.events.includes(e))
  if (missing.length) {
    const updated = await api(`/webhooks/${match.id}`, {
      method: 'PUT',
      body: JSON.stringify({ data: { attributes: { events: EVENTS } } }),
    })
    console.log(`\nAdded missing events (${missing.join(', ')}):`)
    console.log(describe(updated.data))
  }

  if (match.attributes.status !== 'enabled') {
    const enabled = await api(`/webhooks/${match.id}/enable`, { method: 'POST' })
    console.log('\nIt was disabled — PayMongo switches a webhook off after repeated failures. Re-enabled:')
    console.log(describe(enabled.data))
  }
} else {
  const created = await api('/webhooks', {
    method: 'POST',
    body: JSON.stringify({ data: { attributes: { url: target, events: EVENTS } } }),
  })
  console.log('Created:')
  console.log(describe(created.data))
}

const others = (existing.data ?? []).filter((h) => h.attributes?.url !== target)
if (others.length) {
  console.log(`\nOther webhooks on this account (left alone):`)
  for (const hook of others) console.log(`  ${hook.attributes.url}  [${hook.attributes.status}]`)
}

console.log('\nDone. Nothing above includes your secret key.')
