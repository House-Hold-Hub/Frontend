import { afterEach, describe, expect, it } from 'vitest';
import { handOffBearer, takeBearerFromFragment } from './bearerFragment';

const BEARER = 'Zm9vYmFy-AbC_123xyz';

function land(url: string, state: unknown = null) {
  window.history.replaceState(state, '', url);
  return takeBearerFromFragment(window.location, window.history);
}

describe('takeBearerFromFragment', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it.each(['/verify-email', '/verify-email-change', '/verify-email/'])(
    'returns the verifier on %s and removes the fragment from the current history entry',
    (path) => {
      const lengthBefore = window.history.length;

      expect(land(`${path}#verifier=${BEARER}`)).toBe(BEARER);

      expect(window.location.hash).toBe('');
      expect(window.location.href).not.toContain(BEARER);
      expect(window.location.pathname).toBe(path);
      // Replaced, not pushed: Back must not lead to the URL with the bearer.
      expect(window.history.length).toBe(lengthBefore);
    },
  );

  it('keeps the query string and the existing history state', () => {
    const state = { from: 'test' };

    land(`/verify-email?lang=en#verifier=${BEARER}`, state);

    expect(window.location.search).toBe('?lang=en');
    expect(window.history.state).toEqual(state);
  });

  it('strips a fragment that has no usable verifier and returns null', () => {
    expect(land('/verify-email#token=something-secret')).toBeNull();
    expect(window.location.hash).toBe('');

    expect(land('/verify-email-change#verifier=')).toBeNull();
    expect(window.location.hash).toBe('');
  });

  it('returns null when there is no fragment', () => {
    expect(land('/verify-email')).toBeNull();
  });

  it('leaves fragments on other routes alone', () => {
    expect(land(`/somewhere#verifier=${BEARER}`)).toBeNull();
    expect(window.location.hash).toBe(`#verifier=${BEARER}`);
  });
});

describe('handOffBearer', () => {
  it('hands the verifier out once and remembers only that one was present', () => {
    const handoff = handOffBearer(BEARER);

    expect(handoff.present).toBe(true);
    expect(handoff.take()).toBe(BEARER);
    expect(handoff.take()).toBeNull();
    expect(handoff.present).toBe(true);
  });

  it('reports an absent verifier', () => {
    const handoff = handOffBearer(null);

    expect(handoff.present).toBe(false);
    expect(handoff.take()).toBeNull();
  });
});
