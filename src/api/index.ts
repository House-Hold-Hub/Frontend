import { apiBaseUrl } from '../config';
import { createApiClient, type ApiClient, type ApiClientConfig } from './client';

export { createApiClient } from './client';
export type { ApiClient, ApiClientConfig, RetryPolicy } from './client';
export { ApiConfigError, ApiError, isApiError } from './errors';
export type { ApiErrorKind } from './errors';
export type { DiagnosticEvent, DiagnosticsSink } from './diagnostics';
export { redactSensitive, redactString } from './redact';

/** Client wired to the build-time `VITE_API_BASE_URL`. Throws `ApiConfigError` if it is unusable. */
export function createConfiguredApiClient(overrides: Omit<ApiClientConfig, 'baseUrl'> = {}): ApiClient {
  return createApiClient({ ...overrides, baseUrl: apiBaseUrl });
}
