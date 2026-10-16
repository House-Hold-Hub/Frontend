import type { components, paths } from '../contract/schema';

/**
 * Request/response typing derived from the generated OpenAPI types in
 * `src/contract/`. Nothing here restates the contract: every shape is
 * looked up from `paths`, so a contract bump is a compile-time event.
 */

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
export type ApiPath = keyof paths;
export type OperationKey = `${HttpMethod} ${ApiPath}`;

export type ErrorResponse = components['schemas']['ErrorResponse'];
export type ErrorCode = ErrorResponse['code'];

type OperationOf<P extends ApiPath, M extends HttpMethod> = NonNullable<paths[P][M]>;

/**
 * Operations answered with a 302 meant for the browser to follow (OAuth
 * hand-off). They are navigations, not fetch calls, so the client excludes them.
 */
export type NavigationOnlyOperation = Extract<OperationKey, 'get /auth/google' | 'get /auth/google/callback'>;

/** Paths that define the given HTTP method in the contract and are callable through the client. */
export type PathsFor<M extends HttpMethod> = {
  [P in ApiPath]: [OperationOf<P, M>] extends [never]
    ? never
    : `${M} ${P}` extends NavigationOnlyOperation
      ? never
      : P;
}[ApiPath];

type ParametersOf<O> = O extends { parameters: infer Pm } ? Pm : never;
type PathParamsOf<O> = ParametersOf<O> extends { path: infer T } ? T : never;
/** Keeps the contract's distinction between a required and an optional `query` object. */
type QueryOption<O> = ParametersOf<O> extends { query: infer Q }
  ? { query: Q }
  : ParametersOf<O> extends { query?: infer Q }
    ? [NonNullable<Q>] extends [never]
      ? unknown
      : { query?: NonNullable<Q> }
    : unknown;
type BodyOf<O> = O extends { requestBody?: infer R }
  ? [NonNullable<R>] extends [never]
    ? never
    : NonNullable<R> extends { content: { 'application/json': infer B } }
      ? B
      : never
  : never;
type RequiredBodyOf<O> = O extends { requestBody: unknown } ? BodyOf<O> : never;

type ResponsesOf<O> = O extends { responses: infer R } ? R : never;
type SuccessStatus = 200 | 201 | 202 | 204;

/** JSON body of the operation's successful response (`undefined` for 204). */
export type SuccessBody<O> = {
  [S in keyof ResponsesOf<O> & SuccessStatus]: ResponsesOf<O>[S] extends {
    content: { 'application/json': infer B };
  }
    ? B
    : undefined;
}[keyof ResponsesOf<O> & SuccessStatus];

type IfPresent<T, Then> = [T] extends [never] ? unknown : Then;

/**
 * Options for one call. `X-CSRFToken` is deliberately absent: the client owns
 * it, callers cannot forget or override it.
 */
export type RequestOptions<O> = { signal?: AbortSignal } & IfPresent<
  PathParamsOf<O>,
  { pathParams: PathParamsOf<O> }
> &
  QueryOption<O> &
  ([RequiredBodyOf<O>] extends [never]
    ? IfPresent<BodyOf<O>, { body?: BodyOf<O> }>
    : { body: RequiredBodyOf<O> });

export type ResponseOf<P extends ApiPath, M extends HttpMethod> = SuccessBody<OperationOf<P, M>>;
export type OptionsOf<P extends ApiPath, M extends HttpMethod> = RequestOptions<OperationOf<P, M>>;
