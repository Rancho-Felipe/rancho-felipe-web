import { db } from '@/lib/db'
import { getSettings } from '@/lib/settings'
import { quote, type AddOnChoice, type Quote, type RateBand } from '@/lib/booking/pricing'
import { holdWindow, resolveWindow, type PackageKey } from '@/lib/booking/schedule'
import type { QuoteInput } from '@/lib/booking/schema'

/**
 * Prices a selection against the live database.
 *
 * The booking form calls this to show a breakdown, and createBooking recomputes
 * the same thing at the moment of purchase. The browser's copy is a preview and
 * is never used to decide what anyone pays.
 */
export async function priceSelection(input: QuoteInput): Promise<{
  quote: Quote
  checkInAt: Date
  checkOutAt: Date
  maxGuests: number
  overCapacity: boolean
}> {
  const settings = await getSettings()

  const unit = await db.unit.findUnique({
    where: { id: input.unit },
    include: { ratePlans: true },
  })
  if (!unit) throw new Error('Unknown unit.')

  const stay = resolveWindow(input.date, input.package)
  const held = holdWindow(stay, settings.turnoverMinutes, input.extensionHours)

  const chosenAddOns = input.addOnIds.length
    ? await db.addOn.findMany({ where: { id: { in: input.addOnIds }, active: true } })
    : []

  const addOns: AddOnChoice[] = chosenAddOns.map((addOn) => ({
    id: addOn.id,
    name: addOn.name,
    price: addOn.price,
    quantity: 1,
    payOnSite: addOn.payOnSite,
  }))

  const bands: RateBand[] = unit.ratePlans.map((plan) => ({
    package: plan.package as PackageKey,
    minPax: plan.minPax,
    maxPax: plan.maxPax,
    price: plan.price,
  }))

  const priced = quote({
    unitId: input.unit,
    package: input.package,
    paxTotal: input.guests,
    paxUnder4: input.under4,
    bands,
    extraGuestFee: settings.extraGuestFee,
    extensionHours: input.extensionHours,
    extensionRatePerHour: unit.extensionRate,
    addOns,
    depositPercent: settings.depositPercent,
  })

  return {
    quote: priced,
    checkInAt: stay.checkInAt,
    checkOutAt: held.checkOutAt,
    maxGuests: unit.maxGuests,
    // Not an error — the resort does take larger groups — but the form should
    // tell people to call rather than quietly selling more beds than exist.
    overCapacity: input.guests > unit.maxGuests,
  }
}

/** The add-ons that apply to a given unit and package. */
export async function availableAddOns(unitId: string, pkg: PackageKey) {
  const all = await db.addOn.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  })

  return all
    .filter((addOn) => addOn.unitIds.length === 0 || addOn.unitIds.includes(unitId))
    .filter((addOn) => addOn.packages.length === 0 || addOn.packages.includes(pkg))
    .map((addOn) => ({
      id: addOn.id,
      name: addOn.name,
      note: addOn.note,
      price: addOn.price,
      payOnSite: addOn.payOnSite,
    }))
}
