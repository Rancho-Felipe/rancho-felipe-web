import type { Metadata, Viewport } from 'next'
import { Archivo, Instrument_Sans, Martian_Mono } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BookingBar } from '@/components/booking-bar'
import { business, links } from '@/lib/content'

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

export const metadata: Metadata = {
  metadataBase: new URL('https://ranchofelipe.ph'),
  title: {
    default: 'Rancho Felipe — private farm resort in Teresa, Rizal',
    template: '%s — Rancho Felipe',
  },
  description:
    'A private farm resort in Teresa, Rizal, booked one group at a time. Two A-frame casitas and a separate gazebo, each with its own pool. Day tours, night tours and 22-hour stays.',
  keywords: [
    'private resort Teresa Rizal',
    'farm resort near Antipolo',
    'private pool resort Rizal',
    'Rancho Felipe',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    siteName: 'Rancho Felipe',
    title: 'Rancho Felipe — private farm resort in Teresa, Rizal',
    description:
      'Booked one group at a time. Two A-frame casitas and a separate gazebo, each with its own pool.',
  },
  robots: { index: true, follow: true },
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
        <SiteHeader />
        {/* Padding so the fixed mobile bar never covers the last line of a page. */}
        <main id="main" className="pb-20 md:pb-0">
          {children}
        </main>
        <SiteFooter />
        <BookingBar />
        <script
          type="application/ld+json"
          // Real address, real coordinates, real phone numbers, real rates. The
          // geo block comes from the owner's own Maps pin, resolved rather than
          // estimated — a guessed pin sends guests to the wrong farm.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LodgingBusiness',
              name: 'Rancho Felipe',
              description:
                'Private farm resort in Teresa, Rizal, booked exclusively one group at a time.',
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
              telephone: '+63 995 333 9526',
              url: 'https://ranchofelipe.ph',
              petsAllowed: true,
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
