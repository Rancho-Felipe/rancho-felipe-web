import { z } from 'zod'

/* One schema, used by the form in the browser and again on the server.

   The server never trusts what the browser sends. It re-derives the check-in and
   check-out times from the date and package, and it recomputes the price from
   the database — the quote the guest saw is only ever a preview. */

export const unitSlug = z.enum(['casita', 'gazebo'])
export const packageKey = z.enum(['DAY_TOUR', 'NIGHT_TOUR', 'FULL_STAY'])

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date.')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'That date is not real.')

/** Philippine mobile numbers, written the many ways people actually write them. */
const phone = z
  .string()
  .trim()
  .min(7, 'Add a contact number.')
  .max(30, 'That number is too long.')
  .refine(
    (value) => /^[0-9+()\-\s]+$/.test(value),
    'Use digits, spaces, + and - only.',
  )

export const quoteInput = z.object({
  unit: unitSlug,
  package: packageKey,
  date: isoDate,
  guests: z.coerce.number().int().min(1, 'At least one guest.').max(60, 'Please call us for a group that size.'),
  under4: z.coerce.number().int().min(0).max(60).default(0),
  pets: z.coerce.number().int().min(0).max(20).default(0),
  extensionHours: z.coerce.number().int().min(0).max(12).default(0),
  addOnIds: z.array(z.string().max(64)).max(10).default([]),
})

export const bookingInput = quoteInput.extend({
  name: z.string().trim().min(2, 'Tell us your name.').max(120),
  email: z.email('That email address does not look right.').max(200),
  phone,
  address: z.string().trim().min(4, 'Add your address.').max(300),
  note: z.string().trim().max(1000).optional(),
  /** Unticked bots fill this in; real guests never see it. */
  website: z.string().max(0).optional(),
})

export type QuoteInput = z.infer<typeof quoteInput>
export type BookingInput = z.infer<typeof bookingInput>

/** Children under four are free, so they can never outnumber the group. */
export function validateGuestMix(guests: number, under4: number): string | null {
  if (under4 > guests) return 'There cannot be more children under 4 than guests.'
  if (guests - under4 < 1) return 'At least one guest has to be four or older.'
  return null
}
