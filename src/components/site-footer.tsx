import Link from 'next/link'
import { AFrameMark } from '@/components/site-header'
import { business, contact, links, OWNER_EMAIL } from '@/lib/content'

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-night-edge bg-night-raised">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <AFrameMark className="h-6 w-8 text-pool" />
            <span className="font-display text-sm">Rancho Felipe</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-stone">
            A private farm resort in Teresa, Rizal. Booked one group at a time.
          </p>
        </div>

        <div>
          <h2 className="eyebrow">Find us</h2>
          <address className="mt-3 space-y-1 text-sm not-italic text-stone">
            <p>{business.address.street}</p>
            <p>
              {business.address.barangay}, {business.address.city}
            </p>
            <p>{business.address.province}</p>
          </address>
          <a
            href={links.maps}
            className="mt-3 inline-block text-sm text-pool-lift underline underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            Open in Google Maps
          </a>
        </div>

        <div>
          <h2 className="eyebrow">Talk to us</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-stone">
            <li>
              <span className="text-paper">Casita</span>{' '}
              <a href={`tel:${contact.casita.mobile.replace(/-/g, '')}`} className="font-data">
                {contact.casita.mobile}
              </a>
            </li>
            <li>
              <span className="text-paper">Gazebo</span>{' '}
              <a href={`tel:${contact.gazebo.mobile[0].replace(/-/g, '')}`} className="font-data">
                {contact.gazebo.mobile[0]}
              </a>
            </li>
            <li>
              <a href={`mailto:${OWNER_EMAIL}`} className="underline underline-offset-4">
                {OWNER_EMAIL}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="eyebrow">Elsewhere</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-stone">
            <li>
              <a href={links.facebook} target="_blank" rel="noreferrer" className="hover:text-paper">
                Facebook
              </a>
            </li>
            <li>
              <a
                href={links.airbnbCasita}
                target="_blank"
                rel="noreferrer"
                className="hover:text-paper"
              >
                Casita on Airbnb
              </a>
            </li>
            <li>
              <a
                href={links.airbnbGazebo}
                target="_blank"
                rel="noreferrer"
                className="hover:text-paper"
              >
                Gazebo on Airbnb
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-night-edge">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-5 text-xs text-stone">
          <p>© {new Date().getFullYear()} Rancho Felipe</p>
          <Link href="/house-rules" className="hover:text-paper">
            House rules
          </Link>
          <Link href="/rates#policies" className="hover:text-paper">
            Payment &amp; cancellation
          </Link>
        </div>
      </div>
    </footer>
  )
}
