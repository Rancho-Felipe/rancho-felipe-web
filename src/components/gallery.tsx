'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface GallerySource {
  slug: string
  avif: string
  webp: string
  fallback: string
  width: number
  height: number
  alt: string
}

/**
 * Grid plus lightbox. The sources are resolved on the server and handed down,
 * so the manifest never has to be shipped to the browser.
 *
 * Uses the native <dialog> so focus trapping, Esc, and inertness on the rest of
 * the page come from the platform rather than from hand-written key handling.
 */
export function GalleryClient({ items }: { items: GallerySource[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)

  const close = useCallback(() => {
    dialogRef.current?.close()
  }, [])

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) => {
        if (current === null) return current
        return (current + delta + items.length) % items.length
      })
    },
    [items.length],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (openIndex !== null && !dialog.open) dialog.showModal()
  }, [openIndex])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (openIndex === null) return
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        step(1)
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        step(-1)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openIndex, step])

  const active = openIndex === null ? null : items[openIndex]

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, index) => (
          <li key={item.slug}>
            <button
              type="button"
              className="group block w-full overflow-hidden rounded-lg border border-night-edge bg-night-raised"
              onClick={(event) => {
                openerRef.current = event.currentTarget
                setOpenIndex(index)
              }}
            >
              <span className="sr-only">Open larger: {item.alt}</span>
              <picture>
                <source type="image/avif" srcSet={item.avif} sizes="(min-width: 1024px) 25vw, 50vw" />
                <source type="image/webp" srcSet={item.webp} sizes="(min-width: 1024px) 25vw, 50vw" />
                <img
                  src={item.fallback}
                  alt=""
                  width={item.width}
                  height={item.height}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </picture>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={() => {
          setOpenIndex(null)
          openerRef.current?.focus()
        }}
        onClick={(event) => {
          // Clicking the backdrop closes. The dialog element itself fills the
          // viewport, so anything landing on it rather than on a child is backdrop.
          if (event.target === dialogRef.current) close()
        }}
        className="m-0 h-dvh max-h-none w-dvw max-w-none bg-night/95 p-0 backdrop:bg-night/80"
      >
        {active && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <p className="font-data text-xs text-stone">
                {(openIndex ?? 0) + 1} / {items.length}
              </p>
              <button
                type="button"
                onClick={close}
                className="rounded-full border border-stone/40 px-4 py-1.5 text-sm text-paper hover:border-stone"
              >
                Close
              </button>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center px-5 pb-5">
              <picture>
                <source type="image/avif" srcSet={active.avif} sizes="100vw" />
                <source type="image/webp" srcSet={active.webp} sizes="100vw" />
                <img
                  src={active.fallback}
                  alt={active.alt}
                  width={active.width}
                  height={active.height}
                  className="max-h-full w-auto max-w-full object-contain"
                />
              </picture>
            </div>

            <div className="flex items-center justify-between gap-4 px-5 pb-6">
              <button
                type="button"
                onClick={() => step(-1)}
                className="rounded-full border border-stone/40 px-4 py-2 text-sm text-paper hover:border-stone"
              >
                ← Previous
              </button>
              <p className="hidden max-w-md text-center text-xs text-stone sm:block">{active.alt}</p>
              <button
                type="button"
                onClick={() => step(1)}
                className="rounded-full border border-stone/40 px-4 py-2 text-sm text-paper hover:border-stone"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
