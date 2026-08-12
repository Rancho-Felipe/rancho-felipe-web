import manifestJson from '../../content/manifest.json'
import policyJson from '../../content/policy.json'

/* ---------------------------------------------------------------------------
   The manifest and the policy file are the single source of truth for
   everything the site says about the resort. Both were written in Phase 0 from
   the owner's own assets and answers. No copy in this codebase invents a rate,
   an amenity, or a house rule.
--------------------------------------------------------------------------- */

export type PhotoSlug = keyof typeof manifestJson.photos

export interface PhotoRecord {
  src: string
  w: number
  h: number
  widths: number[]
  alt: string
  marketing?: boolean
  duplicate?: boolean
}

const photoTable = manifestJson.photos as unknown as Record<string, PhotoRecord>

export function getPhoto(slug: string): PhotoRecord {
  const photo = photoTable[slug]
  if (!photo) {
    throw new Error(
      `Unknown photo "${slug}". Every image on this site has to exist in content/manifest.json.`,
    )
  }
  return photo
}

/**
 * Phase 0 already produced AVIF and WebP at fixed widths, so images are served
 * through a plain <picture> rather than the Next optimiser. This builds the two
 * srcsets and the fallback for a given slug.
 */
export function photoSources(slug: string) {
  const photo = getPhoto(slug)
  const widths = [...photo.widths].sort((a, b) => a - b)
  const largest = widths[widths.length - 1]

  const srcset = (ext: 'avif' | 'webp') =>
    widths.map((w) => `/media/photos/${slug}-${w}.${ext} ${w}w`).join(', ')

  return {
    avif: srcset('avif'),
    webp: srcset('webp'),
    fallback: `/media/photos/${slug}-${largest}.webp`,
    width: photo.w,
    height: photo.h,
    alt: photo.alt,
    aspect: photo.w / photo.h,
  }
}

/* --- Units ---------------------------------------------------------------- */

export type UnitSlug = 'casita' | 'gazebo'

export const UNIT_ORDER: UnitSlug[] = ['casita', 'gazebo']

export const units = manifestJson.units

export function getUnit(slug: UnitSlug) {
  return units[slug]
}

/** Each unit's identity colour comes from its own material — the casita's pool
 *  mosaic and the gazebo's brick patio. Used on the site map, the calendar and
 *  the booking flow so the two calendars are always distinguishable. */
export const UNIT_ACCENT: Record<UnitSlug, { css: string; name: string }> = {
  casita: { css: 'var(--color-pool)', name: 'pool' },
  gazebo: { css: 'var(--color-brick)', name: 'brick' },
}

/* --- Schedule ------------------------------------------------------------- */

export type PackageKey = 'dayTour' | 'nightTour' | 'fullStay'

export const schedule = policyJson.schedule

export const PACKAGES: {
  key: PackageKey
  label: string
  in: string
  out: string
  hours: number
  endsNextDay: boolean
}[] = [
  {
    key: 'dayTour',
    label: 'Day tour',
    in: schedule.dayTour.in,
    out: schedule.dayTour.out,
    hours: schedule.dayTour.hours,
    endsNextDay: false,
  },
  {
    key: 'nightTour',
    label: 'Night tour',
    in: schedule.nightTour.in,
    out: schedule.nightTour.out,
    hours: schedule.nightTour.hours,
    endsNextDay: true,
  },
  {
    key: 'fullStay',
    label: 'Full stay',
    in: schedule.fullStay.in,
    out: schedule.fullStay.out,
    hours: schedule.fullStay.hours,
    endsNextDay: true,
  },
]

/* --- Everything else ------------------------------------------------------ */

export const business = manifestJson.business
export const contact = manifestJson.contact
export const links = manifestJson.links
export const payment = manifestJson.payment
export const reviews = manifestJson.reviews
export const directions = manifestJson.directions
export const grounds = manifestJson.grounds
export const layout = manifestJson.layout
export const video = manifestJson.video
export const marketing = manifestJson.marketing
export const promotions = manifestJson.promotions

export const policy = policyJson

/** The address the owner uses on their own material. */
export const ADDRESS_LINE = business.address.formatted

/** Where confirmation emails come from and where booking alerts land. */
export const OWNER_EMAIL = 'casanovatraveltours@gmail.com'

/** Philippine time. Every stored timestamp is UTC; every time a guest sees is
 *  rendered in this zone. */
export const RESORT_TIMEZONE = 'Asia/Manila'

export const PESO = '₱'

export function peso(amount: number): string {
  return `${PESO}${amount.toLocaleString('en-PH')}`
}
