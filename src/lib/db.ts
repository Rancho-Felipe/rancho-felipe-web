import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

/**
 * One Prisma client per process. Next's dev server re-evaluates modules on every
 * change, so without the global cache each edit would open another pool and the
 * database would run out of connections within a few minutes.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env, then run `npm run db:dev` in a second terminal.',
    )
  }

  // The local dev database is PGlite behind a socket, which serves one
  // connection at a time. A default-sized pool opens ten and the extras get
  // dropped mid-query. Production uses a real Postgres and wants a real pool,
  // so this is configurable rather than hard-coded.
  const max = Number(process.env.PRISMA_POOL_MAX ?? 10)

  const adapter = new PrismaPg({ connectionString, max })

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  })
}

let client: PrismaClient | undefined

function getClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma
  if (!client) {
    client = createClient()
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = client
    }
  }
  return client
}

/**
 * Built on first use, not on import.
 *
 * This used to be `createClient()` at module scope, which meant importing this
 * file was enough to demand a DATABASE_URL. Next collects data for every route
 * at build time by importing it, so the build could only succeed on a machine
 * that already had a database — locally that was true and it passed, on Vercel
 * it was not and the build died on `/api/admin/bookings/export`.
 *
 * A build should not need a live database. The proxy keeps every call site
 * (`db.booking.findMany(...)`) untouched while moving the connection, and the
 * missing-URL error, to the first real query.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const instance = getClient()
    const value = Reflect.get(instance, property, instance)
    return typeof value === 'function' ? value.bind(instance) : value
  },
})
