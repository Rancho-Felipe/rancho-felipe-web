'use client'

import { useState } from 'react'
import { savePost } from '@/lib/admin/marketing'
import type { SocialPlatform } from '@/generated/prisma/enums'

interface Suggestion {
  id: string
  title: string
  caption: string
  suggestedPhotos: string[]
}

/**
 * Writing a post: pick a starting caption, edit it, choose where it goes, and
 * either save it as a draft or give it a date.
 *
 * "Copy caption" is the button that actually gets used — the owner still posts
 * from the Facebook or TikTok app, so the job here is to hand them finished
 * text with the right prices in it.
 */
export function PostComposer({
  suggestions,
  platforms,
}: {
  suggestions: Suggestion[]
  platforms: Array<{ value: SocialPlatform; label: string }>
}) {
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [photoSlugs, setPhotoSlugs] = useState<string[]>([])
  const [selected, setSelected] = useState<SocialPlatform[]>([])
  const [scheduledFor, setScheduledFor] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function useSuggestion(suggestion: Suggestion) {
    setTitle(suggestion.title)
    setCaption(suggestion.caption)
    setPhotoSlugs(suggestion.suggestedPhotos)
    setError(null)
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Your browser blocked the copy. Select the text and copy it by hand.')
    }
  }

  async function save() {
    setError(null)
    setSaving(true)
    try {
      await savePost({ title, caption, photoSlugs, platforms: selected, scheduledFor })
      setTitle('')
      setCaption('')
      setPhotoSlugs([])
      setSelected([])
      setScheduledFor('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save that.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-night-edge bg-night-raised p-6">
      <p className="eyebrow">Start from one of these</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            onClick={() => useSuggestion(suggestion)}
            className="rounded-full border border-night-edge px-4 py-2 text-sm text-stone hover:border-pool hover:text-paper"
          >
            {suggestion.title}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4">
        <label className="block">
          <span className="eyebrow block">Name it</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="So you can find it again"
            className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 text-sm text-paper"
          />
        </label>

        <label className="block">
          <span className="eyebrow block">Caption</span>
          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            rows={12}
            className="mt-1.5 w-full rounded-lg border border-night-edge bg-night px-3 py-2.5 text-sm text-paper"
          />
          <span className="mt-1 block text-xs text-stone">{caption.length} characters</span>
        </label>

        <div>
          <span className="eyebrow block">Where it goes</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {platforms.map((platform) => {
              const on = selected.includes(platform.value)
              return (
                <button
                  key={platform.value}
                  type="button"
                  onClick={() =>
                    setSelected((current) =>
                      on
                        ? current.filter((value) => value !== platform.value)
                        : [...current, platform.value],
                    )
                  }
                  aria-pressed={on}
                  className={`rounded-full border px-4 py-2 text-sm ${
                    on ? 'border-pool bg-night text-paper' : 'border-night-edge text-stone'
                  }`}
                >
                  {platform.label}
                </button>
              )
            })}
          </div>
        </div>

        {photoSlugs.length > 0 && (
          <div>
            <span className="eyebrow block">Photos to attach</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {photoSlugs.map((slug) => (
                <span
                  key={slug}
                  className="flex items-center gap-2 rounded-full border border-night-edge px-3 py-1.5 font-data text-xs text-stone"
                >
                  {slug}
                  <button
                    type="button"
                    onClick={() => setPhotoSlugs((current) => current.filter((s) => s !== slug))}
                    aria-label={`Remove ${slug}`}
                    className="text-stone hover:text-paper"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-stone">
              These are the site&apos;s own photos. Download them from the Gallery page when you
              post.
            </p>
          </div>
        )}

        <label className="block">
          <span className="eyebrow block">Post it on</span>
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(event) => setScheduledFor(event.target.value)}
            className="mt-1.5 rounded-lg border border-night-edge bg-night px-3 py-2.5 font-data text-sm text-paper"
          />
          <span className="mt-1 block text-xs text-stone">
            Leave empty to keep it as a draft. This is a reminder for you — it does not publish by
            itself.
          </span>
        </label>

        {error && (
          <p role="alert" className="text-sm text-brick-lift">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copyCaption}
            disabled={!caption}
            className="rounded-full bg-pool px-6 py-2.5 text-sm font-medium text-paper disabled:opacity-40"
          >
            {copied ? 'Copied ✓' : 'Copy caption'}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !title}
            className="rounded-full border border-stone/40 px-6 py-2.5 text-sm text-paper hover:border-stone disabled:opacity-40"
          >
            {saving ? 'Saving…' : scheduledFor ? 'Save and schedule' : 'Save as draft'}
          </button>
        </div>
      </div>
    </div>
  )
}
