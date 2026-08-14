import { db } from '@/lib/db'
import { getAvailability } from '@/lib/booking/availability'
import { resortDate } from '@/lib/booking/schedule'
import { policy } from '@/lib/content'

/* Ready-to-paste captions, generated from the live database rather than typed
   out once and left to rot. The whole point: a promo posted in January cannot
   quote a price the site stopped charging in December. */

function peso(value: number) {
  return `₱${value.toLocaleString('en-PH')}`
}

function humanDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-PH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

export interface CaptionSuggestion {
  id: string
  title: string
  caption: string
  suggestedPhotos: string[]
}

export async function captionSuggestions(): Promise<CaptionSuggestion[]> {
  const units = await db.unit.findMany({
    include: { ratePlans: true },
    orderBy: { sortOrder: 'asc' },
  })

  const rateFor = (unitId: string, pkg: string) =>
    units.find((u) => u.id === unitId)?.ratePlans.find((p) => p.package === pkg)?.price ?? 0

  const today = resortDate(new Date())
  const in60 = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10)

  // The next handful of weekend dates that are genuinely still open, so an
  // "available this weekend" post cannot advertise a date already sold.
  const openWeekends: Array<{ unit: string; date: string }> = []
  for (const unit of units) {
    const days = await getAvailability({
      unitId: unit.id as 'casita' | 'gazebo',
      from: today,
      to: in60,
    })
    for (const day of days) {
      const [y, m, d] = day.date.split('-').map(Number)
      const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
      const isWeekend = weekday === 0 || weekday === 6
      if (isWeekend && day.slots.FULL_STAY === 'free' && openWeekends.length < 12) {
        openWeekends.push({ unit: unit.shortName, date: day.date })
      }
    }
  }

  const casitaFull = rateFor('casita', 'FULL_STAY')
  const gazeboFull = rateFor('gazebo', 'FULL_STAY')
  const gazeboDay = rateFor('gazebo', 'DAY_TOUR')
  const included = policy.guests.includedGuests
  const extra = policy.guests.extraGuestFee

  const nextOpen = openWeekends
    .slice(0, 4)
    .map((slot) => `${humanDate(slot.date)} (${slot.unit})`)
    .join(' · ')

  return [
    {
      id: 'weekend-open',
      title: 'Weekend dates still open',
      caption: [
        '🌿 Still open this month at Rancho Felipe, Teresa, Rizal',
        '',
        nextOpen ? `📅 ${nextOpen}` : '📅 Message us for open dates',
        '',
        `Private farm resort — you book the whole place, one group at a time.`,
        `22-hour stay from ${peso(gazeboFull)} (Gazebo) or ${peso(casitaFull)} (Casita).`,
        `Covers ${included} guests, ${peso(extra)} each after that. Kids 3 and under free.`,
        '',
        '✅ Private pool  ✅ Aircon rooms  ✅ Videoke  ✅ WiFi  ✅ Bonfire',
        '⚠️ 30% deposit to reserve. First deposit, first booking.',
        '',
        '📍 Maximiano Compound, Brgy. Dalig, Teresa, Rizal',
        '#TeresaRizal #FarmResort #PrivateResort #StaycationPH #RanchoFelipe',
      ].join('\n'),
      suggestedPhotos: ['casita-twin-a-frames-pool', 'gazebo-pool-umbrellas', 'casita-night-pool-reflection'],
    },
    {
      id: 'day-tour',
      title: 'Day tour, cheapest way in',
      caption: [
        '☀️ Day tour at Rancho Felipe — 7:00 AM to 5:00 PM',
        '',
        `From ${peso(gazeboDay)} for the whole Gazebo, up to ${included} guests.`,
        `Extra guests ${peso(extra)} each. Under 4 free.`,
        '',
        'Private pool, aircon room, videoke, WiFi, and the whole farm to yourselves.',
        'An hour from Metro Manila, minutes from Antipolo.',
        '',
        '📩 Message us to check a date.',
        '#DayTour #TeresaRizal #PrivatePool #RanchoFelipe',
      ].join('\n'),
      suggestedPhotos: ['gazebo-pool-umbrellas', 'casita-pool-with-floats', 'grounds-half-court'],
    },
    {
      id: 'night-tour',
      title: 'Night tour and bonfire',
      caption: [
        '🔥 Night tour — 8:00 PM to 6:00 AM',
        '',
        'Bonfire, videoke, night swimming, and the farm completely to yourselves.',
        `From ${peso(rateFor('gazebo', 'NIGHT_TOUR'))} (Gazebo) or ${peso(rateFor('casita', 'NIGHT_TOUR'))} (Casita).`,
        `Firewood ${peso(250)} to the caretaker. Videoke until ${policy.houseRules.$ownerStated[0].rule.toLowerCase().replace('videoke until ', '')}.`,
        '',
        '📍 Teresa, Rizal · 📩 Message us to reserve',
        '#NightTour #Bonfire #TeresaRizal #RanchoFelipe',
      ].join('\n'),
      suggestedPhotos: ['casita-night-pool-reflection', 'grounds-bonfire-pit', 'grounds-long-hardwood-table'],
    },
    {
      id: 'guest-thanks',
      title: 'Thank a group who stayed',
      caption: [
        '💚 Salamat sa mga bisita namin!',
        '',
        'Thank you for choosing Rancho Felipe. Sana nag-enjoy kayo sa pool, sa bonfire, at sa buong farm.',
        '',
        'Sa uulitin! 🌿',
        '',
        '📩 Message us to book your own date.',
        '#RanchoFelipe #TeresaRizal #FarmResort',
      ].join('\n'),
      suggestedPhotos: ['guest-holy-week', 'guest-ms-nice', 'guest-issa'],
    },
  ]
}
