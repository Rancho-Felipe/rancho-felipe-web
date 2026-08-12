import { photoSources } from '@/lib/content'
import { GalleryClient } from '@/components/gallery'

/** Resolves manifest entries on the server so the client bundle only ever
 *  receives the handful of URLs it actually renders. */
export function Gallery({ slugs }: { slugs: readonly string[] }) {
  const items = slugs.map((slug) => ({ slug, ...photoSources(slug) }))
  return <GalleryClient items={items} />
}
