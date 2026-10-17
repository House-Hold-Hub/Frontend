import type { components } from '../contract/schema';

export type DeliveryStatus = components['schemas']['EmailDeliverySummary']['status'];

/**
 * User-facing text for an `EmailDeliverySummary.status`. `provider_accepted`
 * means the provider took the message, not that it reached the inbox, and a
 * failed or ambiguous attempt is reported as such rather than as a success.
 */
export function describeDelivery(status: DeliveryStatus): { message: string; canRetry: boolean } {
  switch (status) {
    case 'provider_accepted':
      return { message: 'The email is on its way. It can take a few minutes to arrive.', canRetry: false };
    case 'pending':
    case 'unknown':
      return {
        message: 'We could not confirm that the email was sent. If it has not arrived in a few minutes, try again.',
        canRetry: true,
      };
    case 'failed':
      return { message: 'We could not send the email. Try again in a moment.', canRetry: true };
  }
}
