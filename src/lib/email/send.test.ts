import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const sendMail = vi.fn(async (_options: Record<string, unknown>) => ({ messageId: 'smtp-1' }))
const createTransport = vi.fn(() => ({ sendMail }))

vi.mock('nodemailer', () => ({
  default: { createTransport },
  createTransport,
}))

const KEYS = ['RESEND_API_KEY', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM', 'SMTP_HOST', 'SMTP_PORT']

beforeEach(() => {
  vi.resetModules()
  sendMail.mockClear()
  createTransport.mockClear()
  for (const key of KEYS) delete process.env[key]
})

afterEach(() => {
  for (const key of KEYS) delete process.env[key]
})

const message = {
  to: 'guest@example.com',
  subject: 'Holding your date',
  html: '<p>hi</p>',
  text: 'hi',
}

describe('choosing how to send', () => {
  it('does nothing but log when no mail account is set up', async () => {
    const { sendEmail, emailIsConfigured } = await import('./send')

    expect(emailIsConfigured()).toBe(false)
    const result = await sendEmail(message)

    expect(result).toMatchObject({ ok: true, skipped: true })
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('uses SMTP when a mailbox is configured', async () => {
    process.env.SMTP_USER = 'casanovatraveltours@gmail.com'
    process.env.SMTP_PASS = 'app-password'
    const { sendEmail, emailIsConfigured } = await import('./send')

    expect(emailIsConfigured()).toBe(true)
    const result = await sendEmail(message)

    expect(result.ok).toBe(true)
    expect(sendMail).toHaveBeenCalledOnce()
  })

  /* Gmail refuses to send as an address the account does not own. EMAIL_FROM
     still says onboarding@resend.dev from the Resend setup, so left alone every
     send would fail — and it would fail quietly, because email is swallowed. */
  it('sends as the authenticated mailbox, not a leftover EMAIL_FROM', async () => {
    process.env.SMTP_USER = 'casanovatraveltours@gmail.com'
    process.env.SMTP_PASS = 'app-password'
    process.env.EMAIL_FROM = 'Rancho Felipe <onboarding@resend.dev>'
    const { sendEmail } = await import('./send')

    await sendEmail(message)

    const from = sendMail.mock.calls[0][0].from as string
    expect(from).toBe('Rancho Felipe <casanovatraveltours@gmail.com>')
    expect(from).not.toContain('resend.dev')
  })

  it('keeps EMAIL_FROM when it already matches the mailbox', async () => {
    process.env.SMTP_USER = 'casanovatraveltours@gmail.com'
    process.env.SMTP_PASS = 'app-password'
    process.env.EMAIL_FROM = 'Rancho Felipe Resort <casanovatraveltours@gmail.com>'
    const { sendEmail } = await import('./send')

    await sendEmail(message)

    expect(sendMail.mock.calls[0][0].from).toBe(
      'Rancho Felipe Resort <casanovatraveltours@gmail.com>',
    )
  })

  it('defaults to Gmail so only a mailbox and password are needed', async () => {
    process.env.SMTP_USER = 'casanovatraveltours@gmail.com'
    process.env.SMTP_PASS = 'app-password'
    const { sendEmail } = await import('./send')

    await sendEmail(message)

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'smtp.gmail.com', port: 465, secure: true }),
    )
  })

  /* A booking must survive a mail outage. */
  it('reports a refusal instead of throwing', async () => {
    process.env.SMTP_USER = 'casanovatraveltours@gmail.com'
    process.env.SMTP_PASS = 'wrong'
    sendMail.mockRejectedValueOnce(new Error('Invalid login'))
    const { sendEmail } = await import('./send')

    const result = await sendEmail(message)

    expect(result).toMatchObject({ ok: false })
    if (!result.ok) expect(result.error).toContain('Invalid login')
  })
})
