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

export const db = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
