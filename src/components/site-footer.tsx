import Link from 'next/link'
import { BrandLockup } from '@/components/brand-logo'
import { SocialList } from '@/components/social-links'
import { business, contact, links, OWNER_EMAIL } from '@/lib/content'

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-night-edge bg-night-raised">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <BrandLockup className="h-24 w-auto" sizes="(min-width: 640px) 300px, 260px" />
          <p className="mt-3 max-w-xs text-sm text-stone">
            A private farm resort in Teresa, Rizal. Booked one group at a time.
          </p>

          {/* Under the mark rather than buried in a link list. Most people who
              find this farm find it on Facebook or TikTok first, and the
              handles are worth showing in full — they are what gets searched. */}
          <h2 className="eyebrow mt-7">Follow the farm</h2>
          <SocialList />
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
              <a
                href={`tel:${contact.casita.mobile.replace(/-/g, '')}`}
                className="font-data text-base text-paper"
              >
                {contact.casita.mobile}
              </a>
              <span className="block text-xs">
                {contact.casita.channels.join(' · ')} — one number for both units
              </span>
            </li>
            <li>
              <a href={`mailto:${OWNER_EMAIL}`} className="underline underline-offset-4">
                {OWNER_EMAIL}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="eyebrow">Book elsewhere</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-stone">
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
            {/* The farm runs two Facebook pages. The one in "Follow the farm"
                above is the one to lead with; this is the other, kept because
                it is live and people arrive through it. */}
            <li>
              <a
                href={links.facebookTeresa}
                target="_blank"
                rel="noreferrer"
                className="hover:text-paper"
              >
                Second Facebook page
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* A band rather than one more entry in a link list. Someone scrolling to
          the bottom of a page about a weekend for ten is exactly the person who
          has not yet realised they could put a whole debut here, and the
          footer is the last place left to tell them. */}
      <div className="border-t border-night-edge bg-pool/8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-6">
          <div>
            <p className="eyebrow text-pool-lift">Birthdays · Reunions · Team building</p>
            <p className="mt-1.5 text-sm text-paper">
              The whole farm, one group, a stage and a half court.
            </p>
          </div>
          <Link
            href="/events"
            className="group flex items-center gap-2 rounded-full border border-pool/50 px-5 py-2.5 text-sm text-paper transition-colors hover:border-pool hover:bg-pool/15"
          >
            Book it for an event
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        </div>
      </div>

      <div className="border-t border-night-edge">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-5 text-xs text-stone">
          <p>© {new Date().getFullYear()} Rancho Felipe</p>
          <Link href="/events" className="hover:text-paper">
            Events
          </Link>
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
