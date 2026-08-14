export interface PaymentAccount {
  /** Every channel this one number works for. GCash and Maya usually share it. */
  channels: string[]
  /** The account number itself — the thing being copied. */
  value: string
  /** Who the account belongs to, so the guest can check before sending. */
  name: string
}

/**
 * Folds the resort's accounts into what a guest actually needs to see.
 *
 * The owner's GCash and Maya are the same mobile number, and printing it twice
 * under two headings invites the reader to look for a difference that is not
 * there. Where the numbers match they share a row; if the owner ever sets them
 * apart, the rows separate on their own.
 *
 * Deliberately not in the component file. That file is a client component, and
 * both pages that need this are server components — importing a function across
 * that boundary type-checks and builds, then throws on the first request.
 */
export function toAccounts(details: {
  gcash: { number: string; name: string }
  maya: { number: string; name: string }
  bpi: { account: string; name: string }
}): PaymentAccount[] {
  const wallets: PaymentAccount[] =
    details.gcash.number === details.maya.number
      ? [{ channels: ['GCash', 'Maya'], value: details.gcash.number, name: details.gcash.name }]
      : [
          { channels: ['GCash'], value: details.gcash.number, name: details.gcash.name },
          { channels: ['Maya'], value: details.maya.number, name: details.maya.name },
        ]

  return [...wallets, { channels: ['BPI'], value: details.bpi.account, name: details.bpi.name }]
}
