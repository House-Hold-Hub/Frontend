import type { components } from '../contract/schema';

export type DeliveryStatus = components['schemas']['EmailDeliverySummary']['status'];

/**
 * User-facing text for an `EmailDeliverySummary.status`. Each status says only
 * what the server knows: `provider_accepted` means the provider took the
 * message (not that it reached the inbox), `pending` that sending has not
 * finished, `unknown` that the provider's answer was ambiguous, and `failed`
 * that it was not sent. Only `provider_accepted` claims the email was sent;
 * every other status stays retryable.
 *
 * `email` names what was sent, for example "a confirmation link to x@example.test".
 */
export function describeDelivery(status: DeliveryStatus, email: string): { message: string; canRetry: boolean } {
  switch (status) {
    case 'provider_accepted':
      return { message: `We sent ${email}. It can take a few minutes to arrive.`, canRetry: false };
    case 'pending':
      return {
        message: `We are still sending ${email}. If it has not arrived in a few minutes, try again.`,
        canRetry: true,
      };
    case 'unknown':
      return {
        message: `We could not confirm whether ${email} was sent. If it has not arrived in a few minutes, try again.`,
        canRetry: true,
      };
    case 'failed':
      return { message: `We could not send ${email}. Try again in a moment.`, canRetry: true };
  }
}
