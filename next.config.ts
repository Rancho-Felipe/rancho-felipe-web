import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

// This project is its own git repo nested inside a larger folder, so Turbopack
// has to be told where the root is or it walks up and finds the wrong lockfile.
const projectRoot = dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },

  // Every photo in public/media was already resized to fixed widths and encoded
  // to AVIF + WebP during Phase 0. They are served through a plain <picture>
  // element, so the built-in optimiser never touches them. Remote patterns stay
  // empty because the site loads no third-party images at all.
  images: {
    remotePatterns: [],
  },

  // Guests are on mobile data. Compression is on by default but stated here so
  // nobody turns it off by accident.
  compress: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Media filenames are content-stable, so they can be cached hard.
        source: '/media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
