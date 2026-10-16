# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context

House Hold Hub web frontend: React 19, TypeScript 7, Vite 8, npm. Node `^22.22.2 || ^24.15.0 || >=26` (CI uses 22).
This is one of five House-Hold-Hub repositories (ADR-009). The API contract, ADRs and policies live in
[Documentation](https://github.com/House-Hold-Hub/Documentation), not here: `api/openapi.yaml`, `architecture/adr/`,
`security/security-model.md`, `architecture/technology-baseline.md`. Code comments cite them as "ADR-011",
"ADR-014", "security model". Docker Compose belongs to Infrastructure. The shared CI security gates come from Automation.

## Commands

```bash
npm ci                      # app deps + the tools/contract workspace
npm run lint:install        # once: tools/lint is a separate npm project that npm ci does not install
npm run dev
npm run lint
npm run typecheck           # tsc --noEmit
npm test                    # vitest run (jsdom)
npm run build               # typecheck, then vite build to dist/
npm run contract:generate   # rewrite src/contract/ from the pinned spec (fetches from GitHub)
npm run contract:check      # the CI drift check (also fetches)

npx vitest run src/api/client.csrf.test.ts                           # one file
npx vitest run src/api/client.retry.test.ts -t "honours retry.maxRetries"  # one test
```

Required checks on `main`: `lint`, `typecheck`, `test`, `build`, `contract-drift`, `Secret scan / scan` and
`Dependency security / scan`. The contexts are the bare job names, without the `CI / ` prefix that the Actions UI shows,
so renaming a job breaks branch protection. See the README for how the gates work and how to run them locally.

## Three TypeScript toolchains

| Location | TypeScript | Reason | Installed by |
|---|---|---|---|
| root (app) | 7 | app compiler | `npm ci` |
| `tools/contract` | 5.9 | openapi-typescript needs the TS 5 compiler API | `npm ci` (npm workspace) |
| `tools/lint` | 6 | typescript-eslint supports only TS < 6.1 | `npm run lint:install` (own lockfile) |

`tools/lint` is deliberately not a workspace: npm hoisting would make typescript-eslint resolve the app's TS 7.
Don't add it to `workspaces` or move its dependencies to the root. Because the ESLint config
(`tools/lint/eslint.config.js`) is passed with `--config`, its globs resolve from the repo root.

## Generated contract types (`src/contract/`)

`tools/contract/generate.mjs` generates these files from `Documentation/api/openapi.yaml` at the full commit SHA in
`tools/contract/contract.lock.json`. Never edit them by hand: ESLint skips the directory, and `contract-drift` fails on
any difference. They contain types only, with no generated HTTP client. To bump the contract: set `commit` to a
40-character SHA, run `npm run contract:generate` and then `npm run build`, and commit the lock file and `src/contract/`
together. Breaking contract changes need Frontend review (ADR-014).

## API client (`src/api/`)

All typing comes from the generated `paths`. `types.ts` derives `PathsFor<M>`, `OptionsOf` and `ResponseOf` from
them, so `api.request('get', '/not-in-contract')` does not compile and a contract bump shows up as type errors.
Don't restate contract shapes by hand. App code should use `createConfiguredApiClient()` from `src/api/index.ts`, which
wires in `VITE_API_BASE_URL`. `createApiClient()` takes an explicit config.

Security invariants (ADR-011, ADR-014, security model). Tests cover each of them:
- Auth is the HttpOnly session cookie (`credentials: 'same-origin'`). The client never reads cookies.
- The CSRF token is held in memory only. It is bootstrapped with `GET /auth/csrf` and sent as `X-CSRFToken` on every
  unsafe request, public ones included. It is dropped after a successful unsafe `/auth/*` call, on a 401 from a
  protected operation, and after a 403 on a write. `RequestOptions` has no header field, so callers cannot set or override it.
- Only GET is retried (network errors, 502/503/504). Writes are sent exactly once and never replayed.
- `ApiError` carries `kind`, `status`, the contract `code`, `method` and the route *template*. It never carries URLs,
  query strings, bodies, headers or the server `message`; its text comes from `SAFE_ERROR_MESSAGES`. A 404 means
  either "nonexistent" or "outside the caller's scope", and the two cannot be told apart by design.
- The client never logs. Diagnostics go only to the optional sink, through the `sanitizeDiagnosticEvent` allowlist.
  `redactSensitive` is a separate scrubber for third-party error reporters.

The compiler can't enforce these hand-maintained lists, so check them whenever the contract or `ApiErrorKind` changes:
- `PUBLIC_OPERATIONS` plus `NAVIGATION_ONLY_OPERATIONS` (in `client.ts`) must equal the operations marked
  `security: []` in `openapi.yaml`. The generated types don't carry per-operation security. A 401 on a public
  operation is `unauthorized`, and on any other operation it is `session-expired`, which triggers `onSessionLost`.
- The OAuth 302 hand-offs are browser navigations. They are listed both in `NAVIGATION_ONLY_OPERATIONS` (refused at
  runtime) and in the `NavigationOnlyOperation` type in `types.ts` (excluded from `request` at compile time).
- `CODES` in `diagnostics.ts` must list every `ErrorResponse['code']`. A code missing from it arrives as `code: null`.
  `KINDS` must list every `ApiErrorKind`.

## Base URL and environment

`VITE_API_BASE_URL` must be empty (same origin, the default) or exactly the page's own origin. Any other value makes
`createApiClient` throw `ApiConfigError`, including a cross-origin value such as `http://localhost:8000` when the
page is served by the Vite dev server. A cross-origin API needs a CORS/credential security review first. The client adds the `/api/v1` prefix, which comes from
the contract's `servers` entry. `VITE_*` values are public and baked in at build time (Docker takes this one as a build
arg).

## Testing

Vitest and React Testing Library in jsdom (no Jest). Tests sit next to the code as `*.test.ts(x)` and query by role and
accessible name. `vite.config.ts` sets `unstubEnvs` and `restoreMocks`.

- Some modules read `import.meta.env` when they are imported: `src/config.ts`, and through it `App` and
  `src/api/index.ts`. In their tests, call `vi.stubEnv(...)`, then `vi.resetModules()`, then `await import(...)` (see
  `App.test.tsx`).
- API tests never use the network. They combine `src/test/fakeFetch.ts` (`createFakeFetch`, `withCsrf`,
  `jsonResponse`, `errorBody`, `noSleep`) with the `createApiClient` test seams `fetch`, `pageOrigin`, `sleep` and
  `random`.

## Styling

Native CSS, CSS Modules (`*.module.css`) and design tokens as CSS custom properties in `src/styles/tokens.css`.
Tailwind, Material UI, CSS-in-JS and component libraries are out of scope for the MVP.

## Worktrees under `.claude/worktrees/`

ESLint ignores neither `.claude/` nor git-ignored paths. While a Claude Code worktree exists, `npm run lint` from the
main checkout also lints the worktree's copy. The root-relative globs in the config don't match those paths, so lint
reports false errors there, for example `no-undef` in the worktree's `tools/contract/generate.mjs`. Run lint inside the
worktree, or run `npm run lint -- --ignore-pattern '.claude/**'` from the main checkout. Tests and typecheck are not
affected, because their include globs only match root-level paths (`src/`, `vite.config.ts`).

## Conventions

Commit subjects follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`), and the body references the issue
with `Refs #<issue>`. Branches are named `feature/<issue>-<slug>` or `chore/<issue>-<slug>`, and PRs target `main`.
References to other repositories' issues use the form `Backend#8`.
