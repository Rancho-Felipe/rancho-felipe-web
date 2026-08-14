/** Vitest runs outside Next, so .env has to be loaded by hand. */
try {
  process.loadEnvFile('.env')
} catch {
  // CI supplies real env vars.
}

/* ---------------------------------------------------------------------------
   Refuse to run the suite against a database that is not local.

   The overlap tests are not mocked — they create and delete real bookings,
   because the guarantee under test is a Postgres exclusion constraint and
   mocking it would test nothing. That is the right way to test it and it makes
   the connection string dangerous: point .env at the resort's live database,
   which is a reasonable thing to do while running a script, and `npm test`
   quietly starts writing bookings into it.

   It happened. The suite ran against the production database for a while. The
   tests clean up after themselves so nothing was lost, but a crash between
   creating a booking and deleting it would have left a row holding real dates
   against a real unit, and the resort would have turned a guest away.

   So: localhost only, unless someone says otherwise out loud. CI sets
   ALLOW_REMOTE_TEST_DB=1 because there the database is disposable.
--------------------------------------------------------------------------- */
const url = process.env.DATABASE_URL

if (url && !process.env.ALLOW_REMOTE_TEST_DB) {
  const host = (() => {
    try {
      return new URL(url).hostname
    } catch {
      return ''
    }
  })()

  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1'

  if (!isLocal) {
    throw new Error(
      `Refusing to run tests against ${host || 'an unreadable DATABASE_URL'}.\n\n` +
        'These tests write real bookings. Start the local database and point at it:\n' +
        '  npm run db:dev            (in a second terminal)\n' +
        '  DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/rancho" npm test\n\n' +
        'or, if this database really is disposable, set ALLOW_REMOTE_TEST_DB=1.',
    )
  }
}
