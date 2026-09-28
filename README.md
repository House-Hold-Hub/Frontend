# HouseHoldHub Frontend

React 19 + TypeScript + Vite scaffold for the HouseHoldHub browser application.

## Requirements

- Node.js 22.12 or newer
- npm

## Local development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

The application reads its API base URL from `VITE_API_BASE_URL`. The canonical
OpenAPI contract uses the same-origin base path `/api/v1`, which is also the
scaffold default.

## Quality checks

```bash
npm run typecheck
npm run build
```

The Vitest / React Testing Library harness and repository-local CI workflow are
intentionally deferred to Frontend issue #4.

## Styling baseline

The MVP styling baseline is deliberately small:

- native CSS;
- CSS Modules for component-scoped styles;
- CSS custom properties in `src/styles/tokens.css` for design tokens.

The MVP does **not** use Tailwind, Material UI, CSS-in-JS, or an upfront
project-owned generalized component library. Reusable components should be
extracted only when actual repetition, consistency, or accessibility needs
justify them.

## Container image

The Frontend repository owns its service Dockerfile. The image builds the Vite
bundle with Node and serves the resulting static assets with an unprivileged
Nginx runtime.

```bash
docker build \
  --build-arg VITE_API_BASE_URL=/api/v1 \
  -t householdhub-frontend .

docker run --rm -p 8080:8080 householdhub-frontend
```
