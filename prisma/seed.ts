/**
 * Seeds the database with the resort's real data: the two units, the rates off
 * the printed cards, the add-ons the owner listed, and the six genuine guest
 * reviews from the asset folder.
 *
 * Also creates a handful of sample bookings so there is something to click
 * around in admin on a fresh install. Those are clearly fictional guests.
 *
 *   npm run db:seed
 */
import { PrismaClient } from '../src/generated/prisma/client.ts'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

try {
  process.loadEnvFile('.env')
} catch {
  // CI supplies real env vars.
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set.')

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
    max: Number(process.env.PRISMA_POOL_MAX ?? 10),
  }),
})

/** Philippine time is a fixed +08:00, so this is exact. */
function manila(isoDate: string, hour: number): Date {
  return new Date(`${isoDate}T${String(hour).padStart(2, '0')}:00:00+08:00`)
}

/**
 * The calendar day after `isoDate`, as a plain date string.
 *
 * Anchored at UTC midnight on purpose: adding a day to a +08:00 instant and
 * reading it back with toISOString lands on the wrong date, because 16:00Z is
 * already tomorrow in Manila.
 */
function nextDay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const dt = new Date(Date.UTC(year, month - 1, day))
  dt.setUTCDate(dt.getUTCDate() + 1)
  return dt.toISOString().slice(0, 10)
}

async function main() {
  console.log('Seeding Rancho Felipe...')

  // --- Units -------------------------------------------------------------
  await db.unit.upsert({
    where: { id: 'casita' },
    create: {
      id: 'casita',
      name: 'The Private Casita',
      shortName: 'Casita',
      maxGuests: 20,
      includedGuests: 10,
      extensionRate: 500,
      phone: '0995-333-9526',
      airbnbUrl: 'https://airbnb.com/h/rachofelipeteresarizal',
      sortOrder: 1,
    },
    update: { extensionRate: 500, maxGuests: 20, includedGuests: 10 },
  })

  await db.unit.upsert({
    where: { id: 'gazebo' },
    create: {
      id: 'gazebo',
      name: 'The Private Gazebo',
      shortName: 'Gazebo',
      maxGuests: 16,
      includedGuests: 10,
      extensionRate: 300,
      phone: '0977-277-0716',
      airbnbUrl: 'https://airbnb.com/h/ranchofelipegazebo',
      sortOrder: 2,
    },
    update: { extensionRate: 300, maxGuests: 16, includedGuests: 10 },
  })

  // --- Rates --------------------------------------------------------------
  // One base price per unit per package, covering up to 10 guests. Every
  // chargeable guest above 10 adds PHP 300. That is the owner's rule as of
  // 2026-08-12 and it replaces the two-band model the printed cards used.
  const INCLUDED = 10

  const rates: Array<[string, 'DAY_TOUR' | 'NIGHT_TOUR' | 'FULL_STAY', number]> = [
    ['casita', 'DAY_TOUR', 6000],
    ['casita', 'NIGHT_TOUR', 6500],
    ['casita', 'FULL_STAY', 12000],
    ['gazebo', 'DAY_TOUR', 3500],
    ['gazebo', 'NIGHT_TOUR', 4500],
    ['gazebo', 'FULL_STAY', 8000],
  ]

  for (const [unitId, pkg, price] of rates) {
    await db.ratePlan.upsert({
      where: { unitId_package_maxPax: { unitId, package: pkg, maxPax: INCLUDED } },
      create: { unitId, package: pkg, minPax: 1, maxPax: INCLUDED, price },
      update: { price, minPax: 1 },
    })
  }

  // Clear the old upper bands, or they would still catch larger groups and
  // quietly override the per-head rule.
  const removed = await db.ratePlan.deleteMany({ where: { maxPax: { not: INCLUDED } } })
  if (removed.count > 0) console.log(`  removed ${removed.count} superseded rate bands`)

  // --- Add-ons ------------------------------------------------------------
  const addOns = [
    {
      id: 'lpg-tour',
      name: 'LPG for cooking',
      note: 'For a day or night tour',
      price: 250,
      packages: ['DAY_TOUR', 'NIGHT_TOUR'] as const,
      unitIds: [] as string[],
      payOnSite: false,
      sortOrder: 1,
    },
    {
      id: 'lpg-full',
      name: 'LPG for cooking',
      note: 'For the 22-hour stay',
      price: 500,
      packages: ['FULL_STAY'] as const,
      unitIds: [] as string[],
      payOnSite: false,
      sortOrder: 2,
    },
    {
      id: 'bonfire-wood',
      name: 'Firewood for the bonfire',
      note: 'The bonfire is free to use. This is for the wood, handed to the caretaker.',
      price: 250,
      packages: [] as const,
      unitIds: ['casita'],
      payOnSite: true,
      sortOrder: 3,
    },
    {
      id: 'extra-pets',
      name: 'More than 3 pets',
      note: 'Up to 3 pets stay free. Pets are not allowed in the pool.',
      price: 400,
      packages: [] as const,
      unitIds: [] as string[],
      payOnSite: false,
      sortOrder: 4,
    },
  ]

  for (const addOn of addOns) {
    await db.addOn.upsert({
      where: { id: addOn.id },
      create: { ...addOn, packages: [...addOn.packages] },
      update: { price: addOn.price, note: addOn.note, packages: [...addOn.packages] },
    })
  }

  // --- The real reviews ---------------------------------------------------
  const reviews = [
    { author: null, rating: 5, dateLabel: null, imageSlug: 'review-holy-week-group', featured: true,
      text: 'Sulit po ang 2nights stay po sa uilitin po God Bless po' },
    { author: null, rating: 5, dateLabel: null, imageSlug: 'review-gazebo-dinner', featured: true,
      text: 'thank you din po sa pag accomodate, mababait po ang staff nio and super linis at bango din ng place..highly recommended for me' },
    { author: 'Ms. Nice', rating: 5, dateLabel: 'Oct 27', imageSlug: 'review-ms-nice-oct-27', featured: true,
      text: 'Very Recommended ang place if you want to feel the Province Peg. Sarap mag refresh ng mind since ung makikita mo lang mga puno puno. Super nag enjoy ung kids and adults, super babait at ackaso dn ng mga caretaker attentive sa mga needs. Thank you soo much po 2nd Time here and more vacation pa sa place na ito. Thank you' },
    { author: 'Jed', rating: 5, dateLabel: 'Oct 4', imageSlug: 'review-jed-oct-4', featured: false,
      text: 'Ang ganda ng place, very probinsya ang vibe. Peaceful at malinis ang paligid at mga rooms, perfect talaga pang family. Mabait din ang mga care taker. Thank you po ulit sa pag accomodate! Sa uulitin po' },
    { author: 'Issa', rating: 4, dateLabel: 'Sept 27', imageSlug: 'review-issa-sept-27', featured: false,
      text: 'Salamat po sa pag accommodate samin! Ang ganda po ng place. Surrounded ng nature kaya makakapag relax. Malakas ang wifi, malakas ang tubig, ang laki ng kusina, malinis ang rooms at CR, malinis ang pool at mabait ang care taker. Talagang perfect for all groups and occasions! Sa uulitin po.' },
    { author: 'Ziangg', rating: 4, dateLabel: 'July 12-15', imageSlug: 'review-ziangg-july-12', featured: false,
      text: 'Thank you worth it yung place ambait pa nung mga caretaker talagang inasikaso kami kahit late night Na kami nakarating. Sobrang nag enjoy kami sa place ang ganda at ang cool ng place nyo' },
  ]

  if ((await db.review.count()) === 0) {
    for (const [index, review] of reviews.entries()) {
      await db.review.create({ data: { ...review, sortOrder: index } })
    }
  }

  // --- Admin --------------------------------------------------------------
  const email = process.env.ADMIN_EMAIL ?? 'casanovatraveltours@gmail.com'
  const password = process.env.ADMIN_PASSWORD
  if (password) {
    await db.adminUser.upsert({
      where: { email },
      create: {
        email,
        name: 'Rancho Felipe',
        passwordHash: await bcrypt.hash(password, 12),
      },
      update: {},
    })
    console.log(`  admin: ${email}`)
  } else {
    console.log('  admin: skipped (set ADMIN_PASSWORD in .env)')
  }

  // --- Sample bookings so admin is not an empty screen --------------------
  if ((await db.booking.count()) === 0) {
    const year = new Date().getUTCFullYear()
    const samples = [
      {
        reference: `RF-C-${year}-0001`,
        unitId: 'casita',
        package: 'FULL_STAY' as const,
        date: `${year}-09-12`,
        inHour: 14,
        outHour: 12,
        nextDay: true,
        status: 'CONFIRMED' as const,
        guestName: 'Sample: Dela Cruz family',
        total: 15000,
        pax: 14,
      },
      {
        reference: `RF-G-${year}-0001`,
        unitId: 'gazebo',
        package: 'DAY_TOUR' as const,
        date: `${year}-09-12`,
        inHour: 7,
        outHour: 17,
        nextDay: false,
        status: 'AWAITING_VERIFICATION' as const,
        guestName: 'Sample: Reyes barkada',
        total: 3500,
        pax: 9,
      },
      {
        reference: `RF-C-${year}-0002`,
        unitId: 'casita',
        package: 'NIGHT_TOUR' as const,
        date: `${year}-09-20`,
        inHour: 20,
        outHour: 6,
        nextDay: true,
        status: 'PENDING' as const,
        guestName: 'Sample: Santos team building',
        total: 8000,
        pax: 18,
      },
    ]

    for (const s of samples) {
      const checkInAt = manila(s.date, s.inHour)
      const outDate = s.nextDay ? nextDay(s.date) : s.date
      const checkOutAt = manila(outDate, s.outHour)
      const deposit = Math.round(s.total * 0.3)

      await db.booking.create({
        data: {
          reference: s.reference,
          unitId: s.unitId,
          package: s.package,
          checkInAt,
          checkOutAt,
          heldFrom: new Date(checkInAt.getTime() - 3_600_000),
          heldUntil: new Date(checkOutAt.getTime() + 3_600_000),
          status: s.status,
          source: 'DIRECT',
          guestName: s.guestName,
          guestEmail: 'sample@example.com',
          guestPhone: '0900-000-0000',
          guestAddress: 'Sample address, Metro Manila',
          paxTotal: s.pax,
          paxUnder4: 0,
          subtotal: s.total,
          extrasTotal: 0,
          total: s.total,
          depositDue: deposit,
          balanceDue: s.total - deposit,
          breakdown: [{ key: 'base', label: 'Whole unit', amount: s.total }],
          confirmedAt: s.status === 'CONFIRMED' ? new Date() : null,
          holdExpiresAt:
            s.status === 'PENDING' ? new Date(Date.now() + 86_400_000) : null,
        },
      })
    }

    // Counters must agree with the samples, or the next real booking would try
    // to reuse RF-C-0001.
    await db.bookingCounter.upsert({
      where: { unitId_year: { unitId: 'casita', year } },
      create: { unitId: 'casita', year, lastNumber: 2 },
      update: { lastNumber: 2 },
    })
    await db.bookingCounter.upsert({
      where: { unitId_year: { unitId: 'gazebo', year } },
      create: { unitId: 'gazebo', year, lastNumber: 1 },
      update: { lastNumber: 1 },
    })

    console.log('  3 sample bookings')
  }

  console.log('Done.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
