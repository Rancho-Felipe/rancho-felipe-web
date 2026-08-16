import type { Metadata, Viewport } from 'next'
import { Archivo, Instrument_Sans, Martian_Mono } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BookingBar } from '@/components/booking-bar'
import { HideOnAdmin } from '@/components/site-chrome'
import { business, links, policy } from '@/lib/content'

/* The display face is Archivo carrying its width axis, so it can be set wide
   like the painted signboard at the gate. Without the wdth axis it is just
   another grotesque. */
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
})

const instrument = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
  display: 'swap',
})

/* Times, prices, reference codes. */
const martian = Martian_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-martian',
  display: 'swap',
})

/* Every canonical and every og:url is built from this. It was hard-coded to
   https://ranchofelipe.ph — a domain the resort does not own and which does not
   resolve. So each live page was telling Google "the real version of me lives
   somewhere else", which is an instruction Google follows: it drops the page
   that says it. No amount of Search Console submitting would have helped while
   this was wrong. It now follows wherever the site is actually deployed. */
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rancho-felipe-web.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    // What someone actually types: the thing, the place, and the fact that you
    // get the whole of it.
    default: 'Private Resort in Teresa, Rizal — Whole Place, Own Pool | Rancho Felipe',
    template: '%s — Rancho Felipe',
  },
  description:
    'Private resort in Teresa, Rizal, an hour from Metro Manila. Book the whole place — two A-frame casitas or the gazebo, each with its own pool. Day tour, night tour or 22-hour stay from ₱3,500. One group at a time.',
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    siteName: 'Rancho Felipe',
    title: 'Private Resort in Teresa, Rizal — Whole Place, Own Pool',
    description:
      'Book the whole resort, one group at a time. Two A-frame casitas or the gazebo, each with its own pool. Day tour, night tour or 22-hour stay.',
    url: '/',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Rancho Felipe, Teresa, Rizal' }],
  },
  twitter: { card: 'summary_large_image' },
  robots: {
    index: true,
    follow: true,
    // Lets Google show a full-length description and a large image rather than
    // truncating both, which is the difference between a listing someone taps
    // and one they scroll past.
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  alternates: { canonical: '/' },
}

export const viewport: Viewport = {
  themeColor: '#13161f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en-PH"
      data-scroll-behavior="smooth"
      className={`${archivo.variable} ${instrument.variable} ${martian.variable}`}
    >
      <body className="min-h-dvh bg-night text-paper antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-pool focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>
        {/* Admin brings its own header, so the guest chrome steps aside there. */}
        <HideOnAdmin>
          <SiteHeader />
        </HideOnAdmin>

        <main id="main">{children}</main>

        <HideOnAdmin>
          <SiteFooter />
          {/* Sits above the last line of the page, so it gets its own room. */}
          <div className="h-20 md:hidden" aria-hidden="true" />
        </HideOnAdmin>
        <BookingBar />
        <script
          type="application/ld+json"
          // Real address, real coordinates, real phone numbers, real rates. The
          // geo block comes from the owner's own Maps pin, resolved rather than
          // estimated — a guessed pin sends guests to the wrong farm.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              // Resort is a subtype of LodgingBusiness and is the more precise
              // claim — this is not a hotel with rooms, it is a place you take
              // over entirely.
              '@type': 'Resort',
              '@id': `${SITE}/#resort`,
              name: 'Rancho Felipe',
              description:
                'Private farm resort in Teresa, Rizal, booked exclusively one group at a time. Two A-frame casitas and a separate gazebo, each with its own pool.',
              image: `${SITE}/og.jpg`,
              // Both units are listed on Airbnb and the resort answers on
              // Facebook. sameAs is how Google ties those to this site and
              // treats them as one business rather than three strangers.
              sameAs: [links.facebook, links.airbnbCasita, links.airbnbGazebo].filter(Boolean),
              priceRange: '₱3,500–₱12,000',
              currenciesAccepted: 'PHP',
              paymentAccepted: 'GCash, Maya, Credit Card, QR Ph, Bank transfer',
              checkinTime: '07:00',
              checkoutTime: '17:00',
              // Where the guests actually come from. Honest: the resort is in
              // Teresa, it merely serves people travelling out of these places.
              areaServed: [
                { '@type': 'City', name: 'Teresa' },
                { '@type': 'City', name: 'Antipolo' },
                { '@type': 'City', name: 'Morong' },
                { '@type': 'AdministrativeArea', name: 'Rizal' },
                { '@type': 'AdministrativeArea', name: 'Metro Manila' },
              ],
              address: {
                '@type': 'PostalAddress',
                streetAddress: `${business.address.street}, ${business.address.barangay}`,
                addressLocality: business.address.city,
                addressRegion: business.address.province,
                addressCountry: 'PH',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: business.geo.lat,
                longitude: business.geo.lng,
              },
              hasMap: links.maps,
              telephone: '092-646-2149',
              url: SITE,
              petsAllowed: true,
              // The three ways to book, priced. This is what can surface as a
              // "from ₱3,500" line rather than a bare blue link.
              makesOffer: [
                {
                  '@type': 'Offer',
                  name: 'Day tour, 7:00 AM to 5:00 PM',
                  priceCurrency: 'PHP',
                  price: policy.pricing.gazebo.dayTour,
                  description: 'Whole unit, up to 10 guests. Gazebo from this price.',
                },
                {
                  '@type': 'Offer',
                  name: 'Night tour, 8:00 PM to 6:00 AM',
                  priceCurrency: 'PHP',
                  price: policy.pricing.gazebo.nightTour,
                  description: 'Whole unit, up to 10 guests. Gazebo from this price.',
                },
                {
                  '@type': 'Offer',
                  name: '22-hour stay, 2:00 PM to 12:00 NN',
                  priceCurrency: 'PHP',
                  price: policy.pricing.gazebo.fullStay,
                  description: 'Whole unit overnight, up to 10 guests. Gazebo from this price.',
                },
              ],
              amenityFeature: [
                'Private pool',
                'Air-conditioned rooms',
                'Videoke',
                'WiFi',
                'Bonfire area',
                'Half basketball court',
                'Billiards',
              ].map((name) => ({
                '@type': 'LocationFeatureSpecification',
                name,
                value: true,
              })),
            }),
          }}
        />
      </body>
    </html>
  )
}
