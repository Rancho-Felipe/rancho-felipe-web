import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth, signOut } from '@/lib/auth'
import { AFrameMark } from '@/components/site-header'

export const dynamic = 'force-dynamic'

/* The sign-in page deliberately sits outside this group, so everything wrapped
   by this layout is behind the session check below.

   src/proxy.ts also guards /admin, but that is a routing convenience. This is
   the lock: if the matcher were ever mis-edited, these pages would still refuse
   to render. Belt and braces, because the alternative is publishing guests'
   names, phone numbers and payment receipts. */

const NAV = [
  { href: '/admin', label: 'Today' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/calendar', label: 'Calendar' },
  { href: '/admin/rates', label: 'Rates' },
  { href: '/admin/settings', label: 'Settings' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  async function out() {
    'use server'
    await signOut({ redirectTo: '/admin/login' })
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b border-night-edge bg-night-raised">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <AFrameMark className="h-5 w-7 text-pool" />
            <span className="font-display text-sm">Resort admin</span>
          </Link>

          <nav aria-label="Admin" className="order-3 w-full sm:order-none sm:w-auto">
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-paper">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-4 text-sm">
            <Link href="/" className="text-stone hover:text-paper">
              View site
            </Link>
            <form action={out}>
              <button type="submit" className="text-stone hover:text-paper">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {children}
    </div>
  )
}
