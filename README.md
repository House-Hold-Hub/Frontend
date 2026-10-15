# Frontend

House Hold Hub web frontend: React 19 + TypeScript + Vite, managed with npm.
Technology constraints follow the
[Technology Baseline](https://github.com/House-Hold-Hub/Documentation/blob/main/architecture/technology-baseline.md).

## Scripts

| Command | Purpose |
|---|---|
| `npm ci` | Install exact dependencies from `package-lock.json` |
| `npm run dev` | Start the Vite dev server |
| `npm run typecheck` | Type-check without emitting |
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
