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

## Testing and CI

Component tests use Vitest with React Testing Library in jsdom; Jest is not
used (Testing Strategy, Technology Baseline). Tests live next to the code as
`*.test.ts(x)`, query by accessible role/name, and avoid internal structure.
Setup is in `src/test/setup.ts`. No coverage threshold is enforced.

ESLint lives in `tools/lint`, a standalone npm project with its own lockfile,
because typescript-eslint supports TypeScript <6.1 and the app uses
TypeScript 7. Run `npm run lint:install` once before `npm run lint`.

The **CI** workflow runs on every pull request (and pushes to `main`) as four
independent jobs whose names are the status-check contexts:
`CI / lint`, `CI / typecheck`, `CI / test`, `CI / build`. The existing
`Contract drift / contract-drift` workflow is unchanged.

### Required checks for `main` (manual GitHub setting)

Requiring checks is repository configuration, not code. In *Settings →
Branches* (or *Rulesets*) add a rule for `main` with **Require status checks
to pass before merging** and select `CI / lint`, `CI / typecheck`,
`CI / test`, `CI / build` and `Contract drift / contract-drift` (a check can
be selected only after it has run once). Until that is done the checks report
failures but do not block merging.

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
