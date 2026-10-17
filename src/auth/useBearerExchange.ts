import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiClient } from '../api';
import type { BearerHandoff } from './bearerFragment';

export interface ExchangeResult<T> {
  outcome: T;
  /**
   * True when the server did not consume the bearer (rate limit, network or
   * server failure), so the user may try again with the same link.
   */
  retryable: boolean;
}

export type ExchangeState<T> =
  | { kind: 'missing' }
  | { kind: 'pending' }
  | { kind: 'done'; outcome: T; canRetry: boolean };

/**
 * Sends a landing page's bearer exactly once when the page mounts, and again
 * only when the user asks after a retryable failure. The verifier lives in a
 * ref (memory only) and is dropped as soon as the server has answered for it.
 * `exchange` must be a stable function.
 */
export function useBearerExchange<T>(
  api: ApiClient,
  handoff: BearerHandoff,
  exchange: (api: ApiClient, verifier: string) => Promise<ExchangeResult<T>>,
) {
  const [state, setState] = useState<ExchangeState<T>>(() =>
    handoff.present ? { kind: 'pending' } : { kind: 'missing' },
  );
  const verifier = useRef<string | null>(null);
  const started = useRef(false);

  const run = useCallback(async () => {
    const value = verifier.current;
    if (value === null) return;
    const result = await exchange(api, value);
    if (!result.retryable) verifier.current = null;
    setState({ kind: 'done', outcome: result.outcome, canRetry: result.retryable });
  }, [api, exchange]);

  useEffect(() => {
    // StrictMode re-runs effects; the bearer is single-use, so send it once.
    if (started.current) return;
    started.current = true;
    verifier.current = handoff.take();
    void run();
  }, [handoff, run]);

  const retry = useCallback(() => {
    if (verifier.current === null) return;
    setState({ kind: 'pending' });
    void run();
  }, [run]);

  return { state, retry };
}
