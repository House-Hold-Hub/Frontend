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
