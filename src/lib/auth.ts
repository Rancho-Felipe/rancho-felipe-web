import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

/* One admin role, hashed passwords, no public sign-up. The owner is the only
   person who ever signs in, so there is no registration flow, no password
   reset by email, and no OAuth — fewer doors, fewer ways in.

   Accounts are created by the seed script, or by an owner running
   `npm run db:seed` again with a new ADMIN_PASSWORD. */

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: 'jwt',
    // A caretaker's laptop left open in an office is the realistic threat here.
    maxAge: 12 * 60 * 60,
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '').trim().toLowerCase()
        const password = String(credentials?.password ?? '')
        if (!email || !password) return null

        const user = await db.adminUser.findUnique({ where: { email } })

        // Always run a comparison, even when the account does not exist, so the
        // response time does not reveal which emails are real.
        const hash = user?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv'
        const ok = await bcrypt.compare(password, hash)

        if (!user || !ok) return null

        await db.adminUser.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        await db.auditLog.create({
          data: {
            action: 'admin.signin',
            entity: 'admin_user',
            entityId: user.id,
            actorId: user.id,
            actorName: user.name,
          },
        })

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.uid = user.id
      return token
    },
    session({ session, token }) {
      if (token.uid) session.user.id = String(token.uid)
      return session
    },
  },
})

/** Throws unless someone is signed in. Every admin action calls this. */
export async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error('Not signed in.')
  return session.user
}

/** Records who did what, so the owner can see the history of their own resort. */
export async function recordAction(
  action: string,
  entity: string,
  entityId: string | null,
  meta?: Record<string, unknown>,
) {
  const session = await auth()
  await db.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      actorId: session?.user?.id ?? null,
      actorName: session?.user?.name ?? 'unknown',
      meta: meta as never,
    },
  })
}
