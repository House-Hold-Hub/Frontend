import { describe, expect, it } from 'vitest';
import { describeDelivery } from './delivery';

const WHAT = 'a confirmation link to new@example.test';

describe('describeDelivery', () => {
  it('claims the email was sent only when the provider accepted it', () => {
    expect(describeDelivery('provider_accepted', WHAT)).toEqual({
      message: 'We sent a confirmation link to new@example.test. It can take a few minutes to arrive.',
      canRetry: false,
    });
  });

  it.each([
    ['pending', 'We are still sending a confirmation link to new@example.test.'],
    ['unknown', 'We could not confirm whether a confirmation link to new@example.test was sent.'],
    ['failed', 'We could not send a confirmation link to new@example.test.'],
  ] as const)('describes %s distinctly, without claiming it was sent, and allows a retry', (status, opening) => {
    const { message, canRetry } = describeDelivery(status, WHAT);

    expect(message.startsWith(opening)).toBe(true);
    expect(message).not.toMatch(/We sent/);
    expect(canRetry).toBe(true);
  });

  it('gives each status its own text', () => {
    const messages = (['provider_accepted', 'pending', 'unknown', 'failed'] as const).map(
      (status) => describeDelivery(status, WHAT).message,
    );

    expect(new Set(messages).size).toBe(4);
  });
});
