/**
 * The resort's own signboard, cropped from the photo the owner supplied.
 *
 * It is a photograph of a painted wooden plaque, not vector art, so it is
 * served as an image at three widths rather than drawn. The crop sits just
 * inside the board's outer edge, which keeps the sky out of the corners without
 * losing any of the lettering or the ornaments.
 */
export function BrandLogo({
  className = 'h-10 w-auto',
  width = 240,
}: {
  className?: string
  /** Rendered CSS width, used to pick a sensible `sizes` hint. */
  width?: number
}) {
  return (
    <picture>
      <source
        type="image/avif"
        srcSet="/media/brand/logo-sign-240.avif 240w, /media/brand/logo-sign-480.avif 480w, /media/brand/logo-sign-720.avif 720w"
        sizes={`${width}px`}
      />
      <source
        type="image/webp"
        srcSet="/media/brand/logo-sign-240.webp 240w, /media/brand/logo-sign-480.webp 480w, /media/brand/logo-sign-720.webp 720w"
        sizes={`${width}px`}
      />
      <img
        src="/media/brand/logo-sign-480.webp"
        alt="Rancho Felipe — Casita &amp; Gazebo Pools"
        width={470}
        height={200}
        className={`rounded-[3px] ${className}`}
        decoding="async"
      />
    </picture>
  )
}
