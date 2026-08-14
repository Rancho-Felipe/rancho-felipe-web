'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireAdmin, recordAction } from '@/lib/auth'
import type { SocialPlatform } from '@/generated/prisma/enums'

/* ---------------------------------------------------------------------------
   Social accounts and planned posts.

   What this deliberately is NOT: a Facebook or TikTok inbox.

   Reading a Page's messages needs a Meta app, a Page access token, the
   pages_messaging permission and Meta's app review — weeks of business
   verification, and the tokens expire. TikTok publishes no direct-message API
   at all. Building a fake inbox that silently showed nothing would be worse
   than no inbox: the owner would stop checking the real one and miss bookings.

   So this stores the accounts, links straight into each platform's real inbox,
   and does the part software genuinely helps with — writing, scheduling and
   keeping captions honest about the current prices.
--------------------------------------------------------------------------- */

function refresh() {
  revalidatePath('/admin/marketing')
}

export async function saveSocialAccount(input: {
  id?: string
  platform: SocialPlatform
  label: string
  url: string
  inboxUrl?: string
  handle?: string
}) {
  await requireAdmin()

  const url = input.url.trim()
  if (url && !/^https?:\/\//i.test(url)) {
    throw new Error('Paste the full address, starting with https://')
  }
  if (input.inboxUrl && !/^https?:\/\//i.test(input.inboxUrl.trim())) {
    throw new Error('The inbox link also needs to start with https://')
  }

  if (input.id) {
    await db.socialAccount.update({
      where: { id: input.id },
      data: {
        label: input.label.trim(),
        url,
        inboxUrl: input.inboxUrl?.trim() || null,
        handle: input.handle?.trim() || null,
      },
    })
  } else {
    await db.socialAccount.create({
      data: {
        platform: input.platform,
        label: input.label.trim(),
        url,
        inboxUrl: input.inboxUrl?.trim() || null,
        handle: input.handle?.trim() || null,
      },
    })
  }

  await recordAction('social.account_saved', 'social_account', input.id ?? null, {
    platform: input.platform,
  })
  refresh()
  revalidatePath('/', 'layout')
}

export async function removeSocialAccount(id: string) {
  await requireAdmin()
  await db.socialAccount.delete({ where: { id } })
  await recordAction('social.account_removed', 'social_account', id, {})
  refresh()
  revalidatePath('/', 'layout')
}

export async function savePost(input: {
  id?: string
  title: string
  caption: string
  photoSlugs: string[]
  platforms: SocialPlatform[]
  scheduledFor?: string
}) {
  await requireAdmin()

  const title = input.title.trim()
  if (!title) throw new Error('Give the post a name so you can find it again.')

  // A date arrives as yyyy-MM-ddTHH:mm from the browser, which has no timezone.
  // Anchor it to Philippine time rather than the server's.
  const scheduledFor = input.scheduledFor ? new Date(`${input.scheduledFor}:00+08:00`) : null

  const data = {
    title,
    caption: input.caption,
    photoSlugs: input.photoSlugs,
    platforms: input.platforms,
    scheduledFor,
    status: scheduledFor ? ('SCHEDULED' as const) : ('DRAFT' as const),
  }

  const post = input.id
    ? await db.marketingPost.update({ where: { id: input.id }, data })
    : await db.marketingPost.create({ data })

  await recordAction('marketing.post_saved', 'marketing_post', post.id, { title })
  refresh()
}

export async function markPosted(id: string, postUrl: string) {
  await requireAdmin()
  await db.marketingPost.update({
    where: { id },
    data: {
      status: 'POSTED',
      postedAt: new Date(),
      postUrl: postUrl.trim() || null,
    },
  })
  await recordAction('marketing.post_published', 'marketing_post', id, {})
  refresh()
}

export async function deletePost(id: string) {
  await requireAdmin()
  await db.marketingPost.delete({ where: { id } })
  await recordAction('marketing.post_deleted', 'marketing_post', id, {})
  refresh()
}
