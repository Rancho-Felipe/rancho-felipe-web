/* Registers this site's webhook with PayMongo, by hand.
 *
 *   npm run paymongo:webhook
 *   npm run paymongo:webhook -- https://some-other-address
 *
 * The site does this by itself — on the first checkout and again on the nightly
 * job — so this is here for when you want to see the answer now rather than
 * infer it from a payment going through. It shares the server's implementation
 * rather than repeating it, so the two cannot drift apart.
 *
 * Never prints the secret key.
 */
import { readFileSync } from 'node:fs'
import { ensurePayMongoWebhook } from '../src/lib/payments/webhook-setup.ts'

/* Next loads .env on its own; a plain script does not. */
function fromEnvFile(key: string): string | undefined {
  try {
    const found = readFileSync('.env', 'utf8').match(new RegExp(`^${key}="?([^"\n]*)"?$`, 'm'))
    return found?.[1] || undefined
  } catch {
    return undefined
  }
}

process.env.PAYMONGO_SECRET_KEY ||= fromEnvFile('PAYMONGO_SECRET_KEY') ?? ''
const site = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || fromEnvFile('NEXT_PUBLIC_SITE_URL')

const key = process.env.PAYMONGO_SECRET_KEY
console.log(`PayMongo webhook — ${key ? (key.startsWith('sk_live') ? 'LIVE' : 'TEST') : 'no'} key`)

const outcome = await ensurePayMongoWebhook(site)

switch (outcome.status) {
  case 'skipped':
    console.log(`Nothing to do: ${outcome.reason}`)
    break
  case 'failed':
    console.error(`Failed: ${outcome.error}`)
    process.exitCode = 1
    break
  case 'unchanged':
    console.log(`Already correct.\n  id  ${outcome.id}\n  url ${outcome.url}`)
    break
  default:
    console.log(`${outcome.status}.\n  id  ${outcome.id}\n  url ${outcome.url}`)
}
