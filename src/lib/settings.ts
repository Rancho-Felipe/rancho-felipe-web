import { db } from '@/lib/db'
import policy from '../../content/policy.json'

/* Everything the owner can change without a developer. Defaults come from the
   answers they gave in Phase 0; whatever is in the database wins. */

export interface Settings {
  depositPercent: number
  /** Applied to BOTH ends of a booking, so the real gap between two groups is
   *  twice this. Above 30 the night-tour-then-day-tour pair stops being
   *  bookable, because those windows are only 60 minutes apart. */
  turnoverMinutes: number
  /** How long a pending booking holds the date before it is released. */
  holdHours: number
  /** How close to check-in the site stops accepting online bookings. */
  sameDayCutoffHours: number
  extraGuestFee: number
  /** 02:00 — confirmed by the owner after the "till 2pm" ambiguity. */
  videokeCurfew: string
  paymentMethods: {
    gcash: boolean
    maya: boolean
    bpi: boolean
    paymongo: boolean
  }
  bankDetails: {
    gcash: { number: string; name: string }
    maya: { number: string; name: string }
    bpi: { account: string; name: string }
  }
}

export const DEFAULT_SETTINGS: Settings = {
  depositPercent: policy.deposit.percent,
  turnoverMinutes: policy.schedule.turnoverMinutes,
  holdHours: 24,
  sameDayCutoffHours: 6,
  extraGuestFee: policy.guests.extraGuestFee,
  videokeCurfew: '02:00',
  paymentMethods: {
    gcash: true,
    maya: true,
    bpi: true,
    // Off until the owner has a merchant account. The site works on day one
    // without one — manual proof-of-payment is how the resort already operates.
    paymongo: false,
  },
  bankDetails: {
    gcash: { number: '0995-333-9526', name: 'RALPH IVAN SIMEON' },
    maya: { number: '0995-333-9526', name: 'RALPH IVAN SIMEON' },
    bpi: { account: '4059412499 BB', name: 'Ralph Ivan Simeon' },
  },
}

const SETTINGS_KEY = 'site'

export async function getSettings(): Promise<Settings> {
  const row = await db.setting.findUnique({ where: { key: SETTINGS_KEY } })
  if (!row) return DEFAULT_SETTINGS

  // Shallow merge so a setting added in a later release still has a default
  // even if the stored row predates it.
  const stored = row.value as Partial<Settings>
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    paymentMethods: { ...DEFAULT_SETTINGS.paymentMethods, ...stored.paymentMethods },
    bankDetails: { ...DEFAULT_SETTINGS.bankDetails, ...stored.bankDetails },
  }
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings()
  const next: Settings = {
    ...current,
    ...patch,
    paymentMethods: { ...current.paymentMethods, ...patch.paymentMethods },
    bankDetails: { ...current.bankDetails, ...patch.bankDetails },
  }

  await db.setting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: next as unknown as object },
    update: { value: next as unknown as object },
  })

  return next
}
