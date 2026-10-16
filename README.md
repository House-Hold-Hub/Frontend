# Frontend

House Hold Hub web frontend: React 19 + TypeScript + Vite, managed with npm.
Technology constraints follow the
[Technology Baseline](https://github.com/House-Hold-Hub/Documentation/blob/main/architecture/technology-baseline.md).

## Scripts

| Command | Purpose |
|---|---|
| `npm ci` | Install exact dependencies from `package-lock.json` |
| `npm run dev` | Start the Vite dev server |
| `npm run lint:install` | One-time install of the isolated ESLint toolchain (`tools/lint`) |
| `npm run lint` | ESLint (TypeScript, React Hooks, jsx-a11y, Testing Library rules) |
| `npm run typecheck` | Type-check without emitting |
| `npm test` | Run the Vitest + React Testing Library suite once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run build` | Typecheck and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run contract:generate` | Regenerate `src/contract/` from the pinned API contract |
| `npm run contract:check` | Fail if `src/contract/` is missing or differs from regeneration |

## API contract types

`src/contract/` holds TypeScript types generated from the Documentation-owned
[`api/openapi.yaml`](https://github.com/House-Hold-Hub/Documentation/blob/main/api/openapi.yaml)
(ADR-009, ADR-014). Only types are generated, not an HTTP client. Never edit
these files by hand.

- `schema.ts` — `paths`, `components`, `operations` types (openapi-typescript).
- `revision.ts` — `CONTRACT_REVISION` and related constants; the same
  revision, spec SHA-256 and generator version are in each file's header.

The source is pinned to an immutable Documentation commit SHA in
[`tools/contract/contract.lock.json`](tools/contract/contract.lock.json). The
generator lives in the `tools/contract` npm workspace because openapi-typescript
needs the TypeScript 5 compiler API while the app uses TypeScript 7; its
version is locked in `package-lock.json`.

The **Contract drift** GitHub Actions workflow runs `npm run contract:check`,
which regenerates from the pinned revision and fails if a generated file is
missing, hand-modified, or stale relative to the lock.

### Updating the contract revision

1. Pick the new Documentation commit SHA (the full 40 characters, from `main`).
2. Set `commit` in `tools/contract/contract.lock.json`.
3. `npm run contract:generate`
4. `npm run build` to confirm the app still compiles against the new types.
5. Commit the lock file and `src/contract/` together. Breaking contract
   changes need Frontend review per ADR-014.

## API client

`src/api/` is the session/CSRF-aware HTTP client (ADR-011, ADR-014, security
model). Request and response types come from `src/contract/`; nothing in the
contract is restated by hand, so `client.request('get', '/not-in-contract')`
does not compile.

```ts
const api = createConfiguredApiClient({ onSessionLost: () => navigateToSignIn() });
const tasks = await api.request('get', '/households/{household_id}/tasks', {
  pathParams: { household_id },
  query: { page: 1 },
});
```

- **Session and CSRF.** The session cookie is HttpOnly and sent `same-origin`;
  the client never reads it. Before the first unsafe request it calls
  `getCsrfToken` (`GET /auth/csrf`), keeps the token in memory only, and sends
  `X-CSRFToken` on every unsafe request, public ones (login, signup, password
  reset, invitation exchange) included. The token is discarded after any
  successful unsafe `/auth/*` call (session rotation), on 401, and after a 403
  on a write, so the next write starts from a fresh bootstrap.
- **Errors.** `ApiError.kind`: `session-expired` (401 on a protected
  operation, also calls `onSessionLost` once per outage), `unauthorized` (401 on
  a public operation such as bad login credentials), `forbidden` (403),
  `not-found` (404 for nonexistent *and* out-of-scope, indistinguishable),
  `validation` (400, with `fields`), `conflict`, `rate-limited`, `server`,
  `network`, `aborted`, `protocol`. Server `message` text is never surfaced.
- **Retries.** Only `GET` is retried (network errors, 502/503/504, backoff,
  default 2 retries). Writes are sent exactly once and never replayed.
- **Redaction.** Errors and diagnostics carry the OpenAPI path *template*
  (`/households/{household_id}`), never URLs, query strings, fragments, bodies,
  headers, cookies, CSRF values or verifiers. The optional `diagnostics` sink
  receives allowlisted fields only; the client itself never writes to the
  console. `redactSensitive` scrubs free-form values for third-party error
  reporters. Callers must still keep invitation/reset verifiers (URL fragments)
  out of their own logging: read once, POST in the body, discard.
- **Base URL.** `VITE_API_BASE_URL` is either empty (same origin, the default)
  or exactly the page's own origin; credentials, query, fragment, a path, or a
  different origin throw `ApiConfigError` when the client is created. The API
  path `/api/v1` comes from the contract's `servers` entry and is added by the
  client. A cross-origin API needs the CORS/credential review required by the
  security model first; note that the `.env.example` value
  (`http://localhost:8000`) is cross-origin for the Vite dev server and is
  refused until a same-origin dev setup (for example a dev proxy) exists.

## Testing and CI

Component tests use Vitest with React Testing Library in jsdom; Jest is not
used (Testing Strategy, Technology Baseline). Tests live next to the code as
`*.test.ts(x)`, query by accessible role/name, and avoid internal structure.
Setup is in `src/test/setup.ts`. No coverage threshold is enforced.

ESLint lives in `tools/lint`, a standalone npm project with its own lockfile,
because typescript-eslint supports TypeScript <6.1 and the app uses
TypeScript 7. Run `npm run lint:install` once before `npm run lint`.

The **CI** workflow runs on every pull request (and pushes to `main`) as four
independent jobs: `lint`, `typecheck`, `test` and `build`. The existing
**Contract drift** workflow (job `contract-drift`) is unchanged.

### Security gates

The **Gates** workflow (`.github/workflows/gates.yml`, pull requests and pushes
to `main`, no path filters, `contents: read`, no secrets) calls the shared
reusable workflows from Automation (Automation#2), pinned to Automation `main`
commit `5eeae49dfbef5c30fadb4d2ab8a83db068c01488`:

- `Secret scan / scan`: Gitleaks over the commits a pull request adds (the full
  history on pushes to `main`). A `.gitleaks.toml` in the repository root, if
  present, is used.
- `Dependency security / scan`: OSV-Scanner over `package-lock.json` and
  `tools/lint/package-lock.json` (`tools/contract` has no lockfile). Any known
  vulnerability fails the check; there is no severity threshold or exception list.

Both are required status checks on `main`, in addition to the five above.
OpenAPI validation is not run here; Documentation owns it.

To run the same logic locally, install [Gitleaks](https://github.com/gitleaks/gitleaks)
and [OSV-Scanner](https://github.com/google/osv-scanner):

```bash
gitleaks git --redact --log-opts="origin/main..HEAD"
osv-scanner scan source -L package-lock.json -L tools/lint/package-lock.json
```

To bump the gates, change the SHA in `gates.yml` to a newer Automation commit.

**GitHub-native security features are a different mechanism.** Secret
scanning, push protection and Dependabot security updates are repository
settings; they cannot be required status checks and are not configured by this
workflow. Checked with `gh api repos/House-Hold-Hub/Frontend` on 2026-10-16,
`security_and_analysis` reports secret scanning, secret scanning non-provider
patterns, push protection, validity checks and Dependabot security updates all
`disabled`. The adoption of these gates did not enable them; that is a
repository-administrator decision. Until then the two CI gates are the only
automated coverage, and a secret pushed straight to a branch is detected only
once a pull request is opened. Action versions in `ci.yml` and `contract.yml`
(`@v4`) are not SHA-pinned, which is out of scope here.

### Required checks for `main`

Branch protection on `main` requires a pull request (no approving reviews
required), applies to administrators, and requires these status-check contexts
before merging: `lint`, `typecheck`, `test`, `build` and `contract-drift`,
plus the security gates `Secret scan / scan` and `Dependency security / scan`
(see above; confirm the published names with
`gh api repos/House-Hold-Hub/Frontend/commits/<sha>/check-runs`).
The contexts are the bare job names as GitHub reports them; the
`CI / ` and `Contract drift / ` prefixes in the Actions UI are display-only and
must not be used. Renaming a job changes its context and requires updating the
protection rule.

## Styling

Native CSS, CSS Modules (`*.module.css`) and design tokens as CSS custom
properties (`src/styles/tokens.css`). Tailwind, Material UI, CSS-in-JS and a
generalized component library are out of scope for the MVP.

## Configuration

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`; it is read via
`import.meta.env.VITE_API_BASE_URL` (typed in `src/vite-env.d.ts`).

> **`VITE_` variables are public.** Vite embeds them in the JavaScript bundle at
> build time, so anyone can read them. Never store secrets in them, and rebuild
> (or rebuild the image) to change a value.

## Docker

The image builds the app and serves it with nginx (unprivileged) on port 8080.

```bash
docker build --build-arg VITE_API_BASE_URL=http://localhost:8000 -t household-frontend .
docker run --rm -p 8080:8080 household-frontend
```

Multi-service orchestration (Docker Compose) belongs to the Infrastructure repository.
