/**
 * Local Postgres for development, with nothing to install by hand.
 *
 * This runs a real PostgreSQL 18 server from binaries that ship with the
 * `embedded-postgres` package — no Docker, no system install, no sign-in. It is
 * the same engine as production, which matters here: the double-booking guard
 * is a Postgres exclusion constraint, and the tests around it deliberately
 * provoke concurrent transactions. Anything less than real Postgres cannot
 * prove those work.
 *
 *   npm run db:dev
 *
 * Leave it running in its own terminal. Data lives in .pgdata/ — delete that
 * folder to start over.
 */
import { existsSync, mkdirSync } from 'node:fs'
import EmbeddedPostgres from 'embedded-postgres'

const DATA_DIR = '.pgdata'
const PORT = Number(process.env.DEV_DB_PORT ?? 5433)
const DB_NAME = 'rancho'

const firstRun = !existsSync(DATA_DIR)
mkdirSync(DATA_DIR, { recursive: true })

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: 'postgres',
  password: 'postgres',
  port: PORT,
  persistent: true,
  // Without this, initdb takes the encoding from the Windows locale and builds
  // a WIN1252 cluster, which cannot store "₱". Every hosted Postgres is UTF-8,
  // so a WIN1252 dev database would fail on characters that work fine in
  // production — exactly the kind of difference that hides bugs until launch.
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
})

if (firstRun) {
  console.log('First run — initialising the database cluster...')
  await pg.initialise()
}

await pg.start()

if (firstRun) {
  await pg.createDatabase(DB_NAME)
  console.log(`Created database "${DB_NAME}".`)
}

console.log(`PostgreSQL listening on 127.0.0.1:${PORT}`)
console.log(`DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:${PORT}/${DB_NAME}"`)
console.log('Leave this running. Ctrl-C to stop.')

let stopping = false
const shutdown = async () => {
  if (stopping) return
  stopping = true
  console.log('\nStopping PostgreSQL...')
  await pg.stop()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
