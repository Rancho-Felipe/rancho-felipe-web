/** Vitest runs outside Next, so .env has to be loaded by hand. */
try {
  process.loadEnvFile('.env')
} catch {
  // CI supplies real env vars.
}
