#!/usr/bin/env node
/**
 * Push every URL in the sitemap to IndexNow.
 *
 * IndexNow is a shared submission endpoint: one POST reaches Bing, and through
 * it Microsoft Copilot, plus Yandex, Seznam and Naver. Unlike Search Console's
 * "Request indexing" — which this property is currently refused outright, with
 * "Quota exceeded" on the first attempt of the day — there is no quota here.
 *
 * Google does NOT consume IndexNow. Nothing this script does moves the Google
 * problem; it wins a second search engine while that one is worked on.
 *
 * Ownership is proved by hosting a file named for the key, containing the key,
 * at the site root. Deploy that file BEFORE submitting or every URL is
 * rejected as unverified.
 *
 *   npm run seo:indexnow            # submit the live sitemap's URLs
 *   npm run seo:indexnow -- --dry   # print what would be sent, send nothing
 */

const KEY = '39f56cf3ae2cf29b258e38cbc605b09f'
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rancho-felipe-web.vercel.app'
const ENDPOINT = 'https://api.indexnow.org/indexnow'

const dry = process.argv.includes('--dry')
const host = new URL(SITE).host
const keyLocation = `${SITE}/${KEY}.txt`

/* Read the URLs off the deployed sitemap rather than a second hard-coded list,
   so adding a page to src/app/sitemap.ts is the only edit anyone has to make. */
async function urlsFromSitemap() {
  const res = await fetch(`${SITE}/sitemap.xml`, { headers: { 'user-agent': 'rancho-felipe-indexnow' } })
  if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`)
  const xml = await res.text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
  if (urls.length === 0) throw new Error('sitemap.xml parsed but held no <loc> entries')
  return urls
}

/* A key file that is missing or holds the wrong contents means every URL in the
   batch is rejected, and IndexNow reports that as one 403 rather than per-URL,
   so check it here where the error can say what to do about it. */
async function assertKeyIsLive() {
  const res = await fetch(`${keyLocation}?cb=${Date.now()}`)
  if (!res.ok) {
    throw new Error(
      `Key file is not reachable at ${keyLocation} (HTTP ${res.status}).\n` +
        `Deploy public/${KEY}.txt before submitting.`,
    )
  }
  const body = (await res.text()).trim()
  if (body !== KEY) {
    throw new Error(`Key file at ${keyLocation} holds "${body}", expected "${KEY}".`)
  }
}

const urls = await urlsFromSitemap()

console.log(`host         ${host}`)
console.log(`keyLocation  ${keyLocation}`)
console.log(`urls         ${urls.length}`)
for (const u of urls) console.log(`             ${u}`)

if (dry) {
  console.log('\n--dry given, nothing submitted.')
  process.exit(0)
}

await assertKeyIsLive()
console.log('\nkey file verified, submitting...')

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: KEY, keyLocation, urlList: urls }),
})

const text = await res.text()

/* IndexNow answers 200 or 202 on success and says nothing else; the body is
   usually empty, so the status is the whole result. */
if (res.status === 200 || res.status === 202) {
  console.log(`\nAccepted (HTTP ${res.status}). ${urls.length} URLs submitted.`)
  console.log('Bing decides its own crawl order — expect hours to days, not minutes.')
} else {
  console.error(`\nRejected (HTTP ${res.status}). ${text || '(empty body)'}`)
  if (res.status === 403) console.error('403 means the key file did not validate from their side.')
  if (res.status === 422) console.error('422 means a URL did not belong to the declared host.')
  process.exit(1)
}
