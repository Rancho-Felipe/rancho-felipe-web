import { Resend } from 'resend'
import nodemailer, { type Transporter } from 'nodemailer'

/* ---------------------------------------------------------------------------
   Sending email.

   One rule above all: email must never break a booking. A guest who has just
   paid a deposit does not care that the mail server is down, and losing their
   reservation because a receipt failed to send would be far worse than not
   getting the receipt. Every failure here is caught, logged, and swallowed.

   Two ways out, tried in order:

   1. Resend, if RESEND_API_KEY is set. The better option at any scale, but it
      only sends from a domain you own and have verified.

   2. Plain SMTP, if SMTP_USER and SMTP_PASS are set. This exists because the
      resort has a Gmail address and no domain, and buying one to send a
      confirmation email is a poor trade. Gmail allows roughly 500 messages a
      day, which is far more than a two-unit farm resort will ever send, and the
      guest sees an address they already recognise from the Facebook page.

   With neither, the site still works end to end — messages go to the server log
   instead, so the whole flow can be exercised before any mail account exists.
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

let mailer: Transporter | null = null

function smtp(): Transporter | null {
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!user || !pass) return null

  if (!mailer) {
    mailer = nodemailer.createTransport({
      // Defaults are Gmail's, because that is what the resort has. Any other
      // provider works by setting SMTP_HOST and SMTP_PORT.
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: Number(process.env.SMTP_PORT ?? 465) === 465,
      auth: { user, pass },
    })
  }
  return mailer
}

export function emailIsConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY) || Boolean(process.env.SMTP_USER && process.env.SMTP_PASS)
}

/**
 * Who the message claims to be from.
 *
 * Over SMTP this is not free text. Gmail refuses to send as an address the
 * account does not own, so a leftover EMAIL_FROM pointing at a domain the
 * resort never bought would fail every send. When sending over SMTP the
 * authenticated address wins, and EMAIL_FROM only supplies the display name.
 */
function sender(viaSmtp: boolean): string {
  const configured = process.env.EMAIL_FROM ?? 'Rancho Felipe <onboarding@resend.dev>'
  if (!viaSmtp) return configured

  const user = process.env.SMTP_USER!
  if (configured.includes(user)) return configured

  const name = configured.match(/^\s*([^<]+?)\s*</)?.[1] ?? 'Rancho Felipe'
  return `${name} <${user}>`
}

export async function sendEmail(message: Message): Promise<SendResult> {
  const api = resend()
  const transport = api ? null : smtp()
  const from = sender(Boolean(transport))

  if (!api && !transport) {
    // Not an error. The site is expected to run before any mail account exists,
    // and this makes the flow visible in the log meanwhile.
    console.info(
      `[email skipped, no mail transport] to=${String(message.to)} subject="${message.subject}"`,
    )
    return { ok: true, id: null, skipped: true }
  }

  if (transport) {
    try {
      const sent = await transport.sendMail({
        from,
        to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        replyTo: message.replyTo,
        attachments: message.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
        })),
      })
      return { ok: true, id: sent.messageId ?? null }
    } catch (cause) {
      console.error('SMTP refused a message', cause)
      return { ok: false, error: cause instanceof Error ? cause.message : 'Unknown mail error.' }
    }
  }

  try {
    const { data, error } = await api!.emails.send({
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
