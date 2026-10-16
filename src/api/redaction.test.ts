import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiClient } from './client';
import { sanitizeDiagnosticEvent, type DiagnosticEvent } from './diagnostics';
import { ApiError } from './errors';
import { REDACTED, redactSensitive, redactString } from './redact';
import { createFakeFetch, errorBody, jsonResponse, noSleep, withCsrf, type Handler } from '../test/fakeFetch';

const PAGE = 'http://localhost:3000';
const HOUSEHOLD = '3f0c2d1e-0000-4000-8000-000000000001';
const SECRETS = {
  pw: 'hunter2-S3CRET-pw',
  verifier: 'VERIFIER-9f8e7d6c5b4a-bearer',
  csrf: 'csrf-token-SECRET-value-1',
  fragment: 'frag-SECRET-fragment',
  query: 'query-SECRET-value',
  cookie: 'sessionid=SESSION-SECRET-cookie',
  serverMessage: 'server-SECRET-echo for user@example.test',
};
const FORBIDDEN = [
  ...Object.values(SECRETS),
  HOUSEHOLD,
  'http://',
  'https://',
  'localhost',
  '/api/v1',
  '?',
  '#',
  'csrftoken',
  'Bearer',
];

function expectClean(label: string, value: unknown) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  for (const needle of FORBIDDEN) {
    expect(text, `${label} leaked ${needle}`).not.toContain(needle);
  }
}

let consoleSpies: ReturnType<typeof vi.spyOn>[];

beforeEach(() => {
  consoleSpies = (['log', 'info', 'warn', 'error', 'debug', 'trace'] as const).map((m) =>
    vi.spyOn(console, m).mockImplementation(() => undefined),
  );
});
afterEach(() => {
  consoleSpies.forEach((spy) => spy.mockRestore());
});

/** Drives every sensitive code path and returns what a sink/reporter could ever see. */
async function runScenario(handler: Handler) {
  const events: DiagnosticEvent[] = [];
  const reported: unknown[] = [];
  const fake = createFakeFetch(
    withCsrf(handler, [SECRETS.csrf, `${SECRETS.csrf}-2`, `${SECRETS.csrf}-3`, `${SECRETS.csrf}-4`]),
  );
  const client = createApiClient({
    fetch: fake.fetch,
    pageOrigin: PAGE,
    sleep: noSleep,
    diagnostics: (event) => events.push(event),
    onSessionLost: () => undefined,
  });
  const capture = async (run: () => Promise<unknown>) => {
    try {
      await run();
    } catch (error) {
      reported.push(error);
    }
  };

  await capture(() =>
    client.request('post', '/auth/login', { body: { email: 'user@example.test', password: SECRETS.pw } }),
  );
  await capture(() => client.request('post', '/invitations/exchange', { body: { verifier: SECRETS.verifier } as never }));
  await capture(() =>
    client.request('get', '/households/{household_id}/tasks', {
      pathParams: { household_id: HOUSEHOLD },
      query: { due_before: SECRETS.query },
    }),
  );
  await capture(() => client.request('get', '/auth/me'));
  await capture(() =>
    client.request('patch', '/households/{household_id}', {
      pathParams: { household_id: HOUSEHOLD },
      body: { name: SECRETS.pw },
    }),
  );
  return { events, reported, calls: fake.calls };
}

describe('redaction of diagnostics and error payloads', () => {
  const failureCases: [string, Handler][] = [
    ['401', () => jsonResponse(401, errorBody('AUTHENTICATION_ERROR', SECRETS.serverMessage))],
    ['403', () => jsonResponse(403, errorBody('AUTHORIZATION_ERROR', SECRETS.serverMessage))],
    ['404', () => jsonResponse(404, errorBody('NOT_FOUND', SECRETS.serverMessage))],
    ['400 with fields', () => jsonResponse(400, errorBody('VALIDATION_ERROR', SECRETS.serverMessage, { password: [SECRETS.pw] }))],
    ['503 retried', () => jsonResponse(503, errorBody('INTERNAL_ERROR', SECRETS.serverMessage))],
    [
      'network failure echoing the URL',
      (call) =>
        new TypeError(
          `Failed to fetch http://localhost:3000/api/v1${call.path}?x=${SECRETS.query}#${SECRETS.fragment} ${SECRETS.cookie}`,
        ),
    ],
  ];

  it.each(failureCases)('keeps secrets out of every event and error (%s)', async (_name, handler) => {
    const { events, reported, calls } = await runScenario(handler);

    expect(events.length).toBeGreaterThan(0);
    expect(reported.length).toBeGreaterThan(0);
    expectClean('diagnostic events', events);

    for (const error of reported) {
      if (!(error instanceof ApiError)) continue; // bootstrap/other failures are ApiErrors too
      expectClean('error.message', error.message);
      expectClean('error JSON', error);
      expectClean('String(error)', String(error));
      expectClean('error.stack', error.stack ?? '');
      expectClean('redactSensitive(error)', redactSensitive(error));
      expect(error.cause).toBeUndefined();
    }
    expect(reported.every((e) => e instanceof ApiError)).toBe(true);
    expect(calls.length).toBeGreaterThan(0);
  });

  it('keeps secrets out of events and results on the success path too', async () => {
    const { events, calls } = await runScenario(() => jsonResponse(200, { ok: true }));

    expectClean('diagnostic events', events);
    // The wire still carries what the contract requires: that is the point of the request.
    expect(calls.some((c) => c.body?.includes(SECRETS.verifier))).toBe(true);
    expect(calls.some((c) => c.headers.get('X-CSRFToken') === SECRETS.csrf)).toBe(true);
  });

  it('never writes to the console', async () => {
    await runScenario(() => jsonResponse(500, errorBody('INTERNAL_ERROR', SECRETS.serverMessage)));
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
  });

  it('emits only allowlisted fields, with route templates instead of URLs', async () => {
    const { events } = await runScenario(() => jsonResponse(404, errorBody('NOT_FOUND')));
    const allowed = new Set(['type', 'method', 'route', 'status', 'attempt', 'errorKind', 'errorCode']);

    for (const event of events) {
      for (const key of Object.keys(event)) expect(allowed.has(key), key).toBe(true);
    }
    const routes = new Set(events.flatMap((e) => (e.route ? [e.route] : [])));
    expect(routes).toContain('/households/{household_id}/tasks');
    expect(routes).toContain('/auth/login');
  });

  it('survives a diagnostics sink that throws', async () => {
    const fake = createFakeFetch(withCsrf(() => jsonResponse(200, { ok: true })));
    const client = createApiClient({
      fetch: fake.fetch,
      pageOrigin: PAGE,
      diagnostics: () => {
        throw new Error('sink down');
      },
    });

    await expect(client.request('get', '/auth/me')).resolves.toEqual({ ok: true });
  });
});

describe('sanitizeDiagnosticEvent', () => {
  it('drops unknown fields and non-template routes even if a caller passes them', () => {
    const dirty = {
      type: 'request',
      method: 'post',
      route: `/households/${HOUSEHOLD}?token=${SECRETS.query}#${SECRETS.fragment}`,
      status: 200,
      url: `https://example.test/x#${SECRETS.fragment}`,
      body: SECRETS.pw,
      headers: { 'X-CSRFToken': SECRETS.csrf },
      cookie: SECRETS.cookie,
      errorKind: SECRETS.serverMessage,
      errorCode: SECRETS.serverMessage,
    } as unknown as DiagnosticEvent;

    const clean = sanitizeDiagnosticEvent(dirty);

    expect(clean).toEqual({ type: 'request', method: 'post', status: 200 });
    expectClean('sanitized event', clean);
  });

  it('rejects an unknown event type', () => {
    expect(sanitizeDiagnosticEvent({ type: 'leak' } as unknown as DiagnosticEvent).type).toBe('error');
  });
});

describe('redactString / redactSensitive (reporter-facing scrubber)', () => {
  it.each([
    ['https://app.example.test/invite#abc123verifier', 'abc123verifier'],
    ['see /accept?code=ZZTOP99&state=xyz', 'ZZTOP99'],
    ['landing at #verifier-ABCDEF123', 'verifier-ABCDEF123'],
    ['Authorization: Bearer abc.def.ghi', 'abc.def.ghi'],
    ['X-CSRFToken: s3cr3tcsrf', 's3cr3tcsrf'],
    ['csrftoken=s3cr3tcsrf; sessionid=s3ss10n', 's3ss10n'],
    ['Cookie: sessionid=s3ss10n', 's3ss10n'],
    ['password=hunter2', 'hunter2'],
  ])('scrubs %j', (input, secret) => {
    const out = redactString(input);
    expect(out).not.toContain(secret);
  });

  it('leaves harmless text alone', () => {
    expect(redactString('Task list failed to load')).toBe('Task list failed to load');
  });

  it('replaces values under sensitive keys, recurses and caps cycles', () => {
    const payload: Record<string, unknown> = {
      status: 404,
      route: '/households/{household_id}',
      password: SECRETS.pw,
      csrfToken: SECRETS.csrf,
      headers: { cookie: SECRETS.cookie },
      requestBody: { verifier: SECRETS.verifier },
      url: `https://x.test/#${SECRETS.fragment}`,
      nested: [{ note: `visit https://x.test/a?b=${SECRETS.query}` }],
    };
    payload.self = payload;

    const out = redactSensitive(payload) as Record<string, unknown>;

    expect(out.status).toBe(404);
    expect(out.route).toBe('/households/{household_id}');
    expect(out.password).toBe(REDACTED);
    expect(out.self).toBe(REDACTED);
    expectClean('redacted payload', { ...out, route: undefined });
  });

  it('drops opaque browser objects instead of serialising them', () => {
    const out = redactSensitive({
      request: new Request('http://localhost:3000/api/v1/x?q=1', { method: 'POST', body: SECRETS.pw }),
      headers: new Headers({ Cookie: SECRETS.cookie }),
      location: new URL(`http://localhost:3000/#${SECRETS.fragment}`),
      form: new FormData(),
    });

    expectClean('opaque objects', out);
  });

  it('uses the safe toJSON of an ApiError', () => {
    const error = new ApiError({ kind: 'not-found', status: 404, code: 'NOT_FOUND', method: 'get', route: '/households/{household_id}' });
    expect(redactSensitive(error)).toEqual({
      name: 'ApiError',
      kind: 'not-found',
      status: 404,
      code: 'NOT_FOUND',
      method: 'get',
      route: '/households/{household_id}',
    });
  });
});
