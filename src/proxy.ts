import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

/* Next 16 renamed `middleware` to `proxy`. It runs on the Node runtime, which
   is what lets the session be read here at all.

   Everything under /admin is closed except the sign-in page itself. This is a
   second lock rather than the only one — each admin action re-checks the
   session on the server, so a routing mistake here cannot expose anything on
   its own. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/admin/login') return NextResponse.next()

  const session = await auth()
  if (session?.user) return NextResponse.next()

  const login = new URL('/admin/login', request.url)
  // Send them back where they were headed once they are in.
  login.searchParams.set('next', pathname)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/admin/:path*'],
}
