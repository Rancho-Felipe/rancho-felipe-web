import { Resend } from 'resend'

/* ---------------------------------------------------------------------------
   Sending email.

   One rule above all: email must never break a booking. A guest who has just
   paid a deposit does not care that Resend is down, and losing their
   reservation because a receipt failed to send would be far worse than not
   getting the receipt. Every failure here is caught, logged, and swallowed.

   Without RESEND_API_KEY the site still works end to end — messages are written
   to the server log instead, so the flow can be exercised before the owner has
   an account.
--------------------------------------------------------------------------- */

export interface Attachment {
  filename: string
  content: string
}

export interface Message {
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string
  attachments?: Attachment[]
}

export type SendResult =
  | { ok: true; id: string | null; skipped?: boolean }
  | { ok: false; error: string }

let client: Resend | null = null

function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!client) client = new Resend(key)
  return client
}

export function emailIsConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

export async function sendEmail(message: Message): Promise<SendResult> {
  const from = process.env.EMAIL_FROM ?? 'Rancho Felipe <onboarding@resend.dev>'
  const api = resend()

  if (!api) {
    // Not an error. The site is expected to run before the owner has signed up
    // for Resend, and this makes the flow visible in the log meanwhile.
    console.info(
      `[email skipped, no RESEND_API_KEY] to=${String(message.to)} subject="${message.subject}"`,
    )
    return { ok: true, id: null, skipped: true }
  }

  try {
    const { data, error } = await api.emails.send({
      from,
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo,
      attachments: message.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: Buffer.from(attachment.content).toString('base64'),
      })),
    })

    if (error) {
      console.error('Resend refused a message', error)
      return { ok: false, error: error.message ?? 'Resend refused the message.' }
    }

    return { ok: true, id: data?.id ?? null }
  } catch (cause) {
    console.error('Could not reach Resend', cause)
    return { ok: false, error: cause instanceof Error ? cause.message : 'Unknown mail error.' }
  }
}

/**
 * Fire-and-forget wrapper for the places where a booking has already been
 * written and the guest is waiting on a redirect.
 */
export function sendInBackground(message: Message, label: string): void {
  void sendEmail(message)
    .then((result) => {
      if (!result.ok) console.error(`[${label}] not sent: ${result.error}`)
    })
    .catch((cause) => console.error(`[${label}] threw`, cause))
}
