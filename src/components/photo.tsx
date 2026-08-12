import { photoSources } from '@/lib/content'

interface PhotoProps {
  slug: string
  /** Overrides the alt text from the manifest. Pass `alt=""` for images that are
   *  purely decorative and already described by adjacent text. */
  alt?: string
  sizes?: string
  className?: string
  /** Set on the hero and on anything else above the fold. Everything else stays
   *  lazy — most guests are on mobile data. */
  priority?: boolean
}

/**
 * Serves the AVIF and WebP renditions generated in Phase 0.
 *
 * These files are already resized to fixed widths on disk, so running them
 * through the Next image optimiser would re-encode work that is already done
 * and cost money on Vercel for no gain. A plain <picture> is both faster and
 * cheaper here.
 *
 * width/height always come from the manifest so the browser reserves the right
 * box and nothing shifts as images load.
 */
export function Photo({ slug, alt, sizes = '100vw', className, priority }: PhotoProps) {
  const img = photoSources(slug)

  return (
    <picture>
      <source type="image/avif" srcSet={img.avif} sizes={sizes} />
      <source type="image/webp" srcSet={img.webp} sizes={sizes} />
      <img
        src={img.fallback}
        alt={alt ?? img.alt}
        width={img.width}
        height={img.height}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </picture>
  )
}
