import { defineConfig, env } from 'prisma/config'

// Prisma 7 no longer loads .env by itself, and the Next dev server loads it
// through its own path. Node's built-in loader keeps the CLI working without
// pulling in dotenv.
try {
  process.loadEnvFile('.env')
} catch {
  // No .env yet — fine on a fresh clone, and CI supplies real env vars.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
