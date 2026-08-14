import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { inResortTime } from '@/lib/booking/schedule'
import { captionSuggestions } from '@/lib/admin/captions'
import { PostComposer } from '@/components/admin/post-composer'
import {
  saveSocialAccount,
  removeSocialAccount,
  markPosted,
  deletePost,
} from '@/lib/admin/marketing'
import type { SocialPlatform } from '@/generated/prisma/enums'

export const metadata: Metadata = { title: 'Marketing', robots: { index: false } }
export const dynamic = 'force-dynamic'

const PLATFORMS: Array<{
  value: SocialPlatform
  label: string
  inboxHint: string
  defaultInbox: string
}> = [
  {
    value: 'FACEBOOK_PAGE',
    label: 'Facebook Page',
    inboxHint: 'Page inbox — where guest enquiries land',
    defaultInbox: 'https://business.facebook.com/latest/inbox/all',
  },
  {
    value: 'FACEBOOK_PROFILE',
    label: 'Facebook profile',
    inboxHint: 'Personal Messenger',
    defaultInbox: 'https://www.facebook.com/messages/t/',
  },
  {
    value: 'TIKTOK',
    label: 'TikTok',
    inboxHint: 'TikTok inbox',
    defaultInbox: 'https://www.tiktok.com/messages',
  },
  {
    value: 'INSTAGRAM',
    label: 'Instagram',
    inboxHint: 'Instagram direct',
    defaultInbox: 'https://www.instagram.com/direct/inbox/',
  },
]

export default async function MarketingPage() {
  const [accounts, posts, suggestions] = await Promise.all([
    db.socialAccount.findMany({ orderBy: [{ sortOrder: 'asc' }, { platform: 'asc' }] }),
    db.marketingPost.findMany({ orderBy: [{ status: 'asc' }, { scheduledFor: 'asc' }] }),
    captionSuggestions(),
  ])

  async function addAccount(formData: FormData) {
    'use server'
    await saveSocialAccount({
      platform: String(formData.get('platform')) as SocialPlatform,
      label: String(formData.get('label') ?? ''),
      url: String(formData.get('url') ?? ''),
      inboxUrl: String(formData.get('inboxUrl') ?? ''),
      handle: String(formData.get('handle') ?? ''),
    })
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="text-title font-display">Marketing</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone">
        Your accounts in one place, and somewhere to write posts before they go out.
      </p>

      {/* Said plainly and up front, because the alternative is an inbox that
          looks real, shows nothing, and quietly loses bookings. */}
      <div className="mt-6 rounded-xl border border-night-edge bg-night-raised px-5 py-4">
        <h2 className="font-display text-base">About reading messages here</h2>
        <p className="mt-2 text-sm text-stone">
          Facebook and TikTok messages can&apos;t be pulled into this page. Facebook needs a Meta
          developer app, a Page token and Meta&apos;s business review before it will hand over Page
          messages — weeks of verification, and the access expires and has to be renewed. TikTok
          gives no message access at all.
        </p>
        <p className="mt-2 text-sm text-stone">
          So the buttons below open the real inboxes instead. Nothing here pretends to have read
          your messages for you — if it did, you&apos;d stop checking the real one and miss
          bookings. If you later want the Facebook side connected properly, that&apos;s a separate
          piece of work and it starts with a Meta Business account.
        </p>
      </div>

      {/* --- accounts -------------------------------------------------------- */}
      <section className="mt-10">
        <h2 className="font-display text-lg">Your accounts</h2>

        {accounts.length === 0 ? (
          <p className="mt-3 text-sm text-stone">
            Nothing added yet. Add your Facebook Page first — that&apos;s where most enquiries come
            from.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {accounts.map((account) => (
              <li
                key={account.id}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-night-edge bg-night-raised px-5 py-4"
              >
                <span className="min-w-[9rem]">
                  <span className="block text-sm text-paper">{account.label}</span>
                  <span className="eyebrow">
                    {PLATFORMS.find((p) => p.value === account.platform)?.label ?? account.platform}
                  </span>
                </span>

                {account.handle && (
                  <span className="font-data text-xs text-stone">{account.handle}</span>
                )}

                <a
                  href={account.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-pool-lift underline underline-offset-4"
                >
                  Open page
                </a>

                {account.inboxUrl && (
                  <a
                    href={account.inboxUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-pool px-4 py-1.5 text-sm text-paper"
                  >
                    Check messages
                  </a>
                )}

                <form
                  action={async () => {
                    'use server'
                    await removeSocialAccount(account.id)
                  }}
                  className="ml-auto"
                >
                  <button
                    type="submit"
                    className="rounded-full border border-stone/40 px-4 py-1.5 text-xs text-stone hover:border-stone"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form
          action={addAccount}
          className="mt-5 grid gap-4 rounded-xl border border-night-edge p-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <label className="block">
            <span className="eyebrow block">Platform</span>
            <select
              name="platform"
              className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 text-sm text-paper"
            >
              {PLATFORMS.map((platform) => (
                <option key={platform.value} value={platform.value}>
                  {platform.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="eyebrow block">Name it</span>
            <input
              name="label"
              required
              placeholder="Rancho Felipe Teresa"
              className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 text-sm text-paper"
            />
          </label>

          <label className="block">
            <span className="eyebrow block">Handle</span>
            <input
              name="handle"
              placeholder="@ranchofelipe"
              className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 font-data text-sm text-paper"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="eyebrow block">Link to the page or profile</span>
            <input
              name="url"
              type="url"
              required
              placeholder="https://www.facebook.com/RanchoFelipeTeresa"
              className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 font-data text-xs text-paper"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="eyebrow block">Link to its inbox</span>
            <input
              name="inboxUrl"
              type="url"
              placeholder="https://business.facebook.com/latest/inbox/all"
              className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 font-data text-xs text-paper"
            />
            <span className="mt-1 block text-xs text-stone">
              Optional. Adds a “Check messages” button that opens it in a new tab.
            </span>
          </label>

          <div className="sm:col-span-2 lg:col-span-1 lg:self-end">
            <button
              type="submit"
              className="w-full rounded-full bg-pool px-5 py-2.5 text-sm font-medium text-paper"
            >
              Add account
            </button>
          </div>
        </form>
      </section>

      {/* --- composer -------------------------------------------------------- */}
      <section className="mt-12">
        <h2 className="font-display text-lg">Write a post</h2>
        <p className="mt-1 text-sm text-stone">
          The suggested captions are built from today&apos;s prices and the dates that are actually
          still free, so a promo can&apos;t advertise something you no longer sell.
        </p>
        <div className="mt-5">
          <PostComposer suggestions={suggestions} platforms={PLATFORMS.map(({ value, label }) => ({ value, label }))} />
        </div>
      </section>

      {/* --- planned posts ---------------------------------------------------- */}
      <section className="mt-12">
        <h2 className="font-display text-lg">Planned and posted</h2>

        {posts.length === 0 ? (
          <p className="mt-3 text-sm text-stone">Nothing written yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {posts.map((post) => (
              <li key={post.id} className="rounded-xl border border-night-edge bg-night-raised p-5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="text-sm text-paper">{post.title}</span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs ${
                      post.status === 'POSTED'
                        ? 'border-field/50 text-field-lift'
                        : post.status === 'SCHEDULED'
                          ? 'border-pool/50 text-pool-lift'
                          : 'border-night-edge text-stone'
                    }`}
                  >
                    {post.status.toLowerCase()}
                  </span>
                  {post.scheduledFor && (
                    <span className="font-data text-xs text-stone">
                      {inResortTime(post.scheduledFor, 'd MMM yyyy, h:mm a')}
                    </span>
                  )}
                  <span className="text-xs text-stone">
                    {post.platforms
                      .map((p) => PLATFORMS.find((x) => x.value === p)?.label ?? p)
                      .join(' · ')}
                  </span>

                  <form
                    action={async () => {
                      'use server'
                      await deletePost(post.id)
                    }}
                    className="ml-auto"
                  >
                    <button
                      type="submit"
                      className="rounded-full border border-stone/40 px-3 py-1 text-xs text-stone hover:border-stone"
                    >
                      Delete
                    </button>
                  </form>
                </div>

                <pre className="mt-3 whitespace-pre-wrap font-body text-sm text-stone">
                  {post.caption}
                </pre>

                {post.photoSlugs.length > 0 && (
                  <p className="mt-2 font-data text-xs text-stone">
                    Photos: {post.photoSlugs.join(', ')}
                  </p>
                )}

                {post.status !== 'POSTED' && (
                  <form
                    action={async (formData: FormData) => {
                      'use server'
                      await markPosted(post.id, String(formData.get('postUrl') ?? ''))
                    }}
                    className="mt-4 flex flex-wrap items-center gap-2"
                  >
                    <input
                      name="postUrl"
                      placeholder="Link to it once it's live (optional)"
                      className="min-w-[16rem] flex-1 rounded-lg border border-night-edge bg-night px-3 py-2 font-data text-xs text-paper"
                    />
                    <button
                      type="submit"
                      className="rounded-full border border-stone/40 px-4 py-2 text-sm text-paper hover:border-stone"
                    >
                      Mark as posted
                    </button>
                  </form>
                )}

                {post.postUrl && (
                  <a
                    href={post.postUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm text-pool-lift underline underline-offset-4"
                  >
                    See it live
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
