import type { Message } from '@/lib/email/send'
import { inResortTime } from '@/lib/booking/schedule'
import { bookingIcs } from '@/lib/booking/ics'

/* Email HTML is not web HTML. Tables and inline styles, because Gmail strips
   <style> blocks and Outlook ignores flexbox. Kept deliberately plain: the
   receipt has to be readable on a phone with images off. */

const INK = '#13161f'
const PAPER = '#ffffff'
const MUTED = '#6b6f66'
const RULE = '#e2e4de'
const POOL = '#2c91bd'
const BRICK = '#ac7a73'

export interface BookingEmailData {
  reference: string
  unitId: string
  unitName: string
  packageLabel: string
  checkInAt: Date
  checkOutAt: Date
  guestName: string
  guestEmail: string
  guestPhone: string
  guestAddress: string
  paxTotal: number
  paxUnder4: number
  pets: number
  extensionHours: number
  guestNote?: string | null
  lines: Array<{ label: string; detail?: string; amount: number }>
  total: number
  depositDue: number
  balanceDue: number
  holdExpiresAt?: Date | null
  status: string
}

function peso(value: number): string {
  return `PHP ${value.toLocaleString('en-PH')}`
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ranchofelipe.ph'
}

function shell(title: string, accent: string, body: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${title}</title></head>
<body style="margin:0;padding:24px 12px;background:#f4f5f2;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:${PAPER};border-radius:12px;overflow:hidden;border:1px solid ${RULE}">
  <tr><td style="background:${INK};padding:22px 28px">
    <div style="color:${accent};font-size:13px;letter-spacing:.14em;text-transform:uppercase">Rancho Felipe</div>
    <div style="color:#e4e6e1;font-size:13px;margin-top:4px">Teresa, Rizal</div>
  </td></tr>
  <tr><td style="padding:28px">${body}</td></tr>
  <tr><td style="padding:18px 28px;border-top:1px solid ${RULE};color:${MUTED};font-size:12px;line-height:1.6">
    Rancho Felipe, Maximiano Compound, Brgy. Dalig, Teresa, Rizal<br>
    The last stretch of road is rough but passable for cars and vans.
  </td></tr>
</table></body></html>`
}

function detailRows(data: BookingEmailData): string {
  const rows: Array<[string, string]> = [
    ['Reference', data.reference],
    ['Unit', data.unitName],
    ['Check in', inResortTime(data.checkInAt)],
    ['Check out', inResortTime(data.checkOutAt)],
    ['How you booked', data.packageLabel],
    [
      'Guests',
      `${data.paxTotal}${data.paxUnder4 > 0 ? ` (${data.paxUnder4} aged 3 and under, free)` : ''}`,
    ],
    ['Name', data.guestName],
    ['Contact number', data.guestPhone],
    ['Email', data.guestEmail],
    ['Address', data.guestAddress],
  ]
  if (data.pets > 0) rows.push(['Pets', String(data.pets)])
  if (data.extensionHours > 0) rows.push(['Extra hours', String(data.extensionHours)])
  if (data.guestNote) rows.push(['Your note', data.guestNote])

  return rows
    .map(
      ([label, value]) => `<tr>
        <td style="padding:7px 0;color:${MUTED};font-size:13px;vertical-align:top;width:42%">${label}</td>
        <td style="padding:7px 0;font-size:14px;vertical-align:top">${escape(value)}</td>
      </tr>`,
    )
    .join('')
}

function priceRows(data: BookingEmailData): string {
  const lines = data.lines
    .map(
      (line) => `<tr>
        <td style="padding:6px 0;color:${MUTED};font-size:13px">${escape(line.label)}${
          line.detail ? `<br><span style="font-size:11px">${escape(line.detail)}</span>` : ''
        }</td>
        <td style="padding:6px 0;text-align:right;font-size:14px;white-space:nowrap">${peso(line.amount)}</td>
      </tr>`,
    )
    .join('')

  return `${lines}
    <tr><td colspan="2" style="border-top:1px solid ${RULE};height:8px"></td></tr>
    <tr><td style="padding:4px 0;font-size:15px;font-weight:600">Total</td>
        <td style="padding:4px 0;text-align:right;font-size:15px;font-weight:600">${peso(data.total)}</td></tr>
    <tr><td style="padding:4px 0;color:${MUTED};font-size:13px">Deposit to confirm</td>
        <td style="padding:4px 0;text-align:right;font-size:14px">${peso(data.depositDue)}</td></tr>
    <tr><td style="padding:4px 0;color:${MUTED};font-size:13px">Balance on arrival</td>
        <td style="padding:4px 0;text-align:right;font-size:14px">${peso(data.balanceDue)}</td></tr>`
}

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function plainDetails(data: BookingEmailData): string {
  return [
    `Reference: ${data.reference}`,
    `Unit: ${data.unitName}`,
    `Check in: ${inResortTime(data.checkInAt)}`,
    `Check out: ${inResortTime(data.checkOutAt)}`,
    `How you booked: ${data.packageLabel}`,
    `Guests: ${data.paxTotal}${data.paxUnder4 > 0 ? ` (${data.paxUnder4} aged 3 and under, free)` : ''}`,
    `Name: ${data.guestName}`,
    `Contact: ${data.guestPhone}`,
    `Email: ${data.guestEmail}`,
    `Address: ${data.guestAddress}`,
    data.pets > 0 ? `Pets: ${data.pets}` : null,
    data.extensionHours > 0 ? `Extra hours: ${data.extensionHours}` : null,
    data.guestNote ? `Your note: ${data.guestNote}` : null,
    '',
    ...data.lines.map((line) => `${line.label}: ${peso(line.amount)}`),
    `Total: ${peso(data.total)}`,
    `Deposit to confirm: ${peso(data.depositDue)}`,
    `Balance on arrival: ${peso(data.balanceDue)}`,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

function calendarAttachment(data: BookingEmailData): Message['attachments'] {
  const ics = bookingIcs({
    reference: data.reference,
    unitName: data.unitName,
    checkInAt: data.checkInAt,
    checkOutAt: data.checkOutAt,
    guestName: data.guestName,
    guests: data.paxTotal,
    status: data.status,
  })
  return ics ? [{ filename: `${data.reference}.ics`, content: ics }] : undefined
}

/** Sent the moment the date is held, before any money has moved. */
/**
 * `bank` is null once card and e-wallet payment is switched on. The email then
 * sends the guest to the payment page instead of listing account numbers — an
 * inbox is the one place a stale set of bank details survives longest, and a
 * guest transferring by hand to a booking the checkout already settled is the
 * refund nobody wants to process.
 */
export function guestHoldReceipt(
  data: BookingEmailData,
  bank: { gcash: string; maya: string; bpi: string; name: string } | null,
): Message {
  const accent = data.unitId === 'casita' ? POOL : BRICK
  const link = `${siteUrl()}/book/${data.reference}`

  const body = `
    <h1 style="margin:0 0 6px;font-size:22px">We're holding your date</h1>
    <p style="margin:0 0 20px;color:${MUTED};font-size:14px;line-height:1.6">
      Thanks ${escape(data.guestName.split(' ')[0])} — nothing has been charged yet. Send the
      ${peso(data.depositDue)} deposit and upload your receipt, and the resort will confirm.
    </p>

    ${
      data.holdExpiresAt
        ? `<p style="margin:0 0 20px;padding:12px 14px;background:#fdf6ec;border-radius:8px;font-size:13px">
             We'll hold it until <strong>${inResortTime(data.holdExpiresAt)}</strong>. After that the date goes back on sale.
           </p>`
        : ''
    }

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows(data)}</table>

    <h2 style="margin:26px 0 10px;font-size:15px">What it costs</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${priceRows(data)}</table>

    <h2 style="margin:26px 0 10px;font-size:15px">How to pay the deposit</h2>
    ${
      bank
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
             <tr><td style="padding:6px 0;color:${MUTED};width:42%">GCash</td><td style="padding:6px 0">${bank.gcash} — ${escape(bank.name)}</td></tr>
             <tr><td style="padding:6px 0;color:${MUTED}">Maya</td><td style="padding:6px 0">${bank.maya} — ${escape(bank.name)}</td></tr>
             <tr><td style="padding:6px 0;color:${MUTED}">BPI</td><td style="padding:6px 0">${bank.bpi} — ${escape(bank.name)}</td></tr>
           </table>`
        : `<p style="margin:0;font-size:14px;line-height:1.6">
             GCash, Maya, card or QR Ph on a secure payment page. Your booking confirms itself the
             moment it goes through.
           </p>`
    }

    <p style="margin:22px 0 0">
      <a href="${link}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px">
        ${bank ? 'Upload your receipt' : `Pay the ${peso(data.depositDue)} deposit`}
      </a>
    </p>

    <p style="margin:22px 0 0;color:${MUTED};font-size:12px;line-height:1.6">
      The deposit is not refundable, but your date can be moved. First deposit, first reservation —
      no pencil booking.
    </p>`

  return {
    to: data.guestEmail,
    subject: `Holding your date — ${data.reference}`,
    html: shell('Your booking', accent, body),
    text: [
      `We're holding your date.`,
      '',
      plainDetails(data),
      '',
      ...(bank
        ? [
            `Pay the deposit by GCash ${bank.gcash}, Maya ${bank.maya}, or BPI ${bank.bpi} (${bank.name}).`,
            `Then upload your receipt: ${link}`,
          ]
        : [
            `Pay the ${peso(data.depositDue)} deposit by GCash, Maya, card or QR Ph: ${link}`,
            'Your booking confirms itself the moment the payment goes through.',
          ]),
      '',
      'The deposit is not refundable, but your date can be moved.',
    ].join('\n'),
    attachments: calendarAttachment(data),
  }
}

/** Sent once the owner has checked the receipt. */
export function guestConfirmed(data: BookingEmailData, houseRules: string[]): Message {
  const accent = data.unitId === 'casita' ? POOL : BRICK

  const body = `
    <h1 style="margin:0 0 6px;font-size:22px">You're booked</h1>
    <p style="margin:0 0 20px;color:${MUTED};font-size:14px;line-height:1.6">
      Your deposit is in and the date is confirmed. Bring ${peso(data.balanceDue)} on arrival.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows(data)}</table>

    <h2 style="margin:26px 0 10px;font-size:15px">House rules</h2>
    <ul style="margin:0;padding-left:18px;color:${MUTED};font-size:13px;line-height:1.8">
      ${houseRules.map((rule) => `<li>${escape(rule)}</li>`).join('')}
    </ul>

    <h2 style="margin:26px 0 10px;font-size:15px">Getting here</h2>
    <p style="margin:0;color:${MUTED};font-size:13px;line-height:1.7">
      Search "Rancho Felipe Teresa" on Google Maps or Waze. Enter the rough road from the main
      highway and drive straight for 300 metres. At the Aqua Joe water station, turn left and
      continue 100 metres to the entrance.<br>
      <a href="https://maps.app.goo.gl/7GEkxMbs8x4Ns5NQ7" style="color:${accent}">Open the map</a>
    </p>`

  return {
    to: data.guestEmail,
    subject: `Confirmed — ${data.reference}`,
    html: shell('Booking confirmed', accent, body),
    text: [
      `You're booked. Bring ${peso(data.balanceDue)} on arrival.`,
      '',
      plainDetails(data),
      '',
      'House rules:',
      ...houseRules.map((rule) => `- ${rule}`),
      '',
      'Getting here: search "Rancho Felipe Teresa" on Google Maps or Waze.',
      'https://maps.app.goo.gl/7GEkxMbs8x4Ns5NQ7',
    ].join('\n'),
    attachments: calendarAttachment(data),
  }
}

/** Lands in the owner's inbox the moment a booking is made. */
export function ownerNewBooking(data: BookingEmailData, to: string): Message {
  const accent = data.unitId === 'casita' ? POOL : BRICK
  const link = `${siteUrl()}/admin/bookings/${data.reference}`

  const body = `
    <h1 style="margin:0 0 6px;font-size:20px">New booking — ${data.unitName}</h1>
    <p style="margin:0 0 18px;color:${MUTED};font-size:14px">
      ${escape(data.guestName)} · ${data.paxTotal} guests · deposit ${peso(data.depositDue)} due
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows(data)}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px">${priceRows(data)}</table>
    <p style="margin:22px 0 0">
      <a href="${link}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px">
        Open in admin
      </a>
    </p>`

  return {
    to,
    replyTo: data.guestEmail,
    subject: `New booking ${data.reference} — ${data.unitName}, ${inResortTime(data.checkInAt, 'd MMM')}`,
    html: shell('New booking', accent, body),
    text: [`New booking — ${data.unitName}`, '', plainDetails(data), '', link].join('\n'),
  }
}

/** Lands when a guest uploads proof and the owner needs to look at it. */
export function ownerProofUploaded(data: BookingEmailData, to: string, method: string): Message {
  const accent = data.unitId === 'casita' ? POOL : BRICK
  const link = `${siteUrl()}/admin/bookings/${data.reference}`

  const body = `
    <h1 style="margin:0 0 6px;font-size:20px">Payment receipt to check</h1>
    <p style="margin:0 0 18px;color:${MUTED};font-size:14px">
      ${escape(data.guestName)} uploaded a ${escape(method)} receipt for ${peso(data.depositDue)} on
      ${data.reference}. The dates stay held until you confirm or reject it.
    </p>
    <p style="margin:0">
      <a href="${link}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px">
        Check the receipt
      </a>
    </p>`

  return {
    to,
    subject: `Receipt uploaded — ${data.reference}`,
    html: shell('Receipt uploaded', accent, body),
    text: `${data.guestName} uploaded a ${method} receipt for ${peso(data.depositDue)} on ${data.reference}.\n${link}`,
  }
}
