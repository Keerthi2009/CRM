/**
 * Payment service — currently implements manual payment records.
 * Designed so Stripe (or any gateway) can be swapped in by replacing
 * the `createPaymentIntent` and `confirmPayment` functions below.
 */

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
}

/**
 * Stub: In production, replace with:
 *   const intent = await stripe.paymentIntents.create({ amount: amountCents, currency })
 *   return intent.client_secret
 */
export async function createPaymentIntent(
  amount: number,
  currency: string,
  metadata: Record<string, string>,
): Promise<{ clientSecret: string | null; externalId: string | null }> {
  console.log('[Payment] createPaymentIntent stub called', { amount, currency, metadata });
  return { clientSecret: null, externalId: null };
}

/**
 * Stub: log payment details (email / webhook notification would go here).
 */
export async function sendPaymentNotification(
  recipientEmail: string,
  amount: number,
  currency: string,
  notes?: string,
): Promise<void> {
  console.log(
    `[Payment] Notification → ${recipientEmail}: ${currency.toUpperCase()} ${amount.toFixed(2)}${notes ? ` — ${notes}` : ''}`,
  );
}
