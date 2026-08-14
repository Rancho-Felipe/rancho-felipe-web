import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth, signOut } from '@/lib/auth'
import { AFrameMark } from '@/components/site-header'
import { AdminNav } from '@/components/admin/admin-nav'

export const dynamic = 'force-dynamic'

/* The sign-in page deliberately sits outside this group, so everything wrapped
   by this layout is behind the session check below.

   src/proxy.ts also guards /admin, but that is a routing convenience. This is
   the lock: if the matcher were ever mis-edited, these pages would still refuse
   to render. Belt and braces, because the alternative is publishing guests'
   names, phone numbers and payment receipts. */

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  async function out() {
    'use server'
    await signOut({ redirectTo: '/admin/login' })
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-night-edge bg-night-raised/95 backdrop-blur">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-4 px-5 py-3">
            <Link href="/admin" className="flex shrink-0 items-center gap-2.5">
              <AFrameMark className="h-5 w-7 text-pool" />
              <span className="font-display text-sm">Resort admin</span>
            </Link>

            {/* Inline from the small-tablet width up; below that it becomes the
                scrolling strip underneath. */}
            <div className="ml-auto hidden sm:block">
              <AdminNav />
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-4 text-sm sm:ml-6">
              <Link href="/" className="hidden text-stone hover:text-paper sm:inline">
                View site
              </Link>
              <form action={out}>
                <button type="submit" className="text-stone hover:text-paper">
                  Sign out
                </button>
              </form>
            </div>
          </div>

          <div className="sm:hidden">
            <AdminNav />
          </div>
        </div>
      </header>

      {children}
    </div>
  )
}
