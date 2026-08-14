import { NextResponse } from 'next/server'

/* TEMPORARY DIAGNOSTIC - delete once the deployment is settled.
   Reports whether each setting arrived and how long it is. Never the value:
   a length and a yes/no is enough to tell "missing" from "empty" from "fine",
   and nothing here is worth leaking. */

export const dynamic = 'force-dynamic'

const KEYS = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'AUTH_TRUST_HOST',
  'NEXT_PUBLIC_SITE_URL',
  'ADMIN_EMAIL',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
  'EMAIL_FROM',
  'EMAIL_OWNER',
  'CRON_SECRET',
  'RESEND_API_KEY',
  'PAYMONGO_SECRET_KEY',
  'VERCEL_ENV',
]

export async function GET() {
  const report = Object.fromEntries(
    KEYS.map((key) => {
      const value = process.env[key]
      return [
        key,
        value === undefined ? 'MISSING' : value === '' ? 'EMPTY' : `set (${value.length} chars)`,
      ]
    }),
  )

  return NextResponse.json({
    report,
    totalEnvKeys: Object.keys(process.env).length,
    sawDatabaseKeyAtAll: Object.keys(process.env).filter((k) => /DATABASE|POSTGRES|NEON/i.test(k)),
  })
}
