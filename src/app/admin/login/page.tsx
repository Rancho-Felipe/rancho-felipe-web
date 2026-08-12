import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth, signIn } from '@/lib/auth'
import { AFrameMark } from '@/components/site-header'

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const params = await searchParams
  const session = await auth()
  if (session?.user) redirect(params.next ?? '/admin')

  async function submit(formData: FormData) {
    'use server'
    const next = String(formData.get('next') || '/admin')

    try {
      await signIn('credentials', {
        email: formData.get('email'),
        password: formData.get('password'),
        redirectTo: next,
      })
    } catch (error) {
      // next-auth signals a successful redirect by throwing, so that one has to
      // be re-thrown or sign-in silently fails.
      if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error
      if (typeof error === 'object' && error !== null && 'digest' in error) throw error
      redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`)
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-14">
      <div className="flex items-center gap-2.5">
        <AFrameMark className="h-6 w-8 text-pool" />
        <span className="font-display text-sm">Rancho Felipe</span>
      </div>

      <h1 className="mt-6 text-title font-display">Sign in</h1>
      <p className="mt-2 text-sm text-stone">This is the resort&apos;s own page. Guests don&apos;t need it.</p>

      {params.error && (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-brick/40 bg-night-raised px-4 py-3 text-sm text-brick-lift"
        >
          That email and password don&apos;t match. Try again.
        </p>
      )}

      <form action={submit} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={params.next ?? '/admin'} />

        <div>
          <label htmlFor="email" className="eyebrow block">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 text-sm text-paper"
          />
        </div>

        <div>
          <label htmlFor="password" className="eyebrow block">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 text-sm text-paper"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-pool px-6 py-3 font-medium text-paper"
        >
          Sign in
        </button>
      </form>
    </section>
  )
}
