/**
 * The resort's logo, in two lockups.
 *
 * The artwork arrives as dark brown and gold on cream — the wrong way round for
 * a site that is dark almost everywhere. Rather than dropping a pale rectangle
 * into the header, the cream ground is removed and only the dark ink is lifted
 * to paper, which leaves the gold arc, the roof outlines and the swoosh exactly
 * as drawn. Light shapes and gold on near-black, instead of a sticker.
 *
 * Two lockups because one does not fit both jobs:
 *
 *   <BrandEmblem />  the twin roofs, palms and sun. Legible at 32px, so it
 *                    carries the header beside the name set in the site's own
 *                    display face.
 *   <BrandLockup />  the whole thing including "Staycation & Leisure". Needs
 *                    real width to read, so it belongs in the footer and in
 *                    email, never in a 44px header where the tagline would
 *                    collapse into a smudge.
 */

export function BrandEmblem({ className = 'h-9 w-auto' }: { className?: string }) {
  return (
    <picture>
      <source
        type="image/webp"
        srcSet="/media/brand/emblem-120.webp 120w, /media/brand/emblem-240.webp 240w, /media/brand/emblem-360.webp 360w"
        sizes="120px"
      />
      <img
        src="/media/brand/emblem-240.png"
        alt=""
        aria-hidden="true"
        width={950}
        height={435}
        className={className}
        decoding="async"
      />
    </picture>
  )
}

export function BrandLockup({
  className = 'h-24 w-auto',
  sizes = '300px',
}: {
  className?: string
  sizes?: string
}) {
  return (
    <picture>
      <source
        type="image/webp"
        srcSet="/media/brand/lockup-300.webp 300w, /media/brand/lockup-600.webp 600w, /media/brand/lockup-900.webp 900w"
        sizes={sizes}
      />
      <img
        src="/media/brand/lockup-600.png"
        alt="Rancho Felipe — Staycation &amp; Leisure"
        width={1135}
        height={810}
        className={className}
        decoding="async"
      />
    </picture>
  )
}
