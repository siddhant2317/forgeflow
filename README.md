# LineForge

A manufacturing ERP application for managing parts libraries, bill of materials (BOM) trees, inventory, and work orders. Independent portfolio demo — not affiliated with any company or commercial product.

## Quick Start

```bash
cp .env.example .env
docker-compose up
```

This starts:
- **PostgreSQL 16** on port `5432`
- **API** (Apollo Server / GraphQL / Express) on port `4000` — runs `prisma migrate deploy` automatically
- **Web** (Vite / React) on port `5173`

Then open [http://localhost:5173](http://localhost:5173).

To seed with sample Merlin-1D rocket engine data:

```bash
# After docker-compose up is running:
pnpm --filter @lineforge/api db:seed
```

## Architecture

```
lineforge-app/
├── apps/
│   ├── api/           # Express + Apollo Server 4 + GraphQL + Prisma ORM
│   └── web/           # Vite + React 18 + TypeScript + Tailwind + Apollo Client
├── packages/
│   └── shared/        # Shared TypeScript types
├── e2e/               # Playwright end-to-end tests
├── docker-compose.yml          # Local dev
├── docker-compose.prod.yml     # Production
└── docker-compose.test.yml     # Integration tests
```

### Data Flow

```
Browser
  │  Apollo Client (POST /graphql with Bearer JWT)
  ▼
Vercel CDN (static React build)  or  Vite Dev Server (proxy)
  │
  ▼
Express + Apollo Server 4
  │  helmet, cors, rate-limit, depth-limit
  │  Context: { prisma, user }
  ▼
Prisma ORM  (Zod validates inputs)
  │
  ▼
PostgreSQL 16 (managed in prod)
```

### Key Design Decisions

- **pnpm workspaces** — monorepo with shared lockfile
- **Express + Apollo Server 4** — needed for proper middleware (CORS, helmet, rate limiting)
- **JWT authentication** — email/password (bcrypt) + Google OAuth; token in `Authorization: Bearer` header
- **Zod validation** — all mutation inputs validated before reaching Prisma
- **Prisma** — migrations deployed via `prisma migrate deploy` in Docker entrypoint
- **DataLoader** — batches BOM child lookups to prevent N+1 queries
- **Circular BOM guard** — visited `Set<string>` passed through recursive `buildTree`
- **Pino logging** — structured JSON in production, pretty-printed in development
- **Error masking** — Prisma errors mapped to user-friendly messages, internal errors hidden

## Development (without Docker)

```bash
# Install dependencies
pnpm install

# Start postgres locally (or set DATABASE_URL to an existing instance)
docker-compose up postgres -d

# Copy environment variables
cp .env.example .env

# Generate Prisma client
pnpm --filter @lineforge/api db:generate

# Apply migrations
pnpm --filter @lineforge/api db:migrate

# Start API
pnpm --filter @lineforge/api dev

# Start web (in another terminal)
pnpm --filter @lineforge/web dev
```

## Testing

```bash
# Unit tests (all workspaces)
pnpm test

# Integration tests (requires test DB on port 5433)
docker-compose -f docker-compose.test.yml up -d
DATABASE_URL=postgresql://lineforge:lineforge@localhost:5433/lineforge_test \
  pnpm --filter @lineforge/api test:integration

# E2E tests (requires full docker-compose stack running)
docker-compose up -d
pnpm e2e
```

## Production Deployment

### Web (Vercel)

1. Import the repo in Vercel
2. Set **Root Directory** to `apps/web`
3. Set environment variables:
   - `VITE_API_URL` — your API server URL (e.g. `https://api.lineforge.example.com`)
   - `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID
4. Vercel auto-detects Vite and runs the build via `vercel.json`

### API (Docker host — Railway, Render, Fly.io, etc.)

1. Set up a managed PostgreSQL instance (Neon, Supabase, Railway Postgres)
2. Deploy the API container using the production Dockerfile or `docker-compose.prod.yml`
3. Set required environment variables:

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | Yes |
| `JWT_SECRET` | Random secret for signing JWTs (min 32 chars) | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins | Yes |
| `NODE_ENV` | Set to `production` | Yes |
| `PORT` | Server port (default: 4000) | No |
| `LOG_LEVEL` | Pino log level (default: `info`) | No |

### Using docker-compose.prod.yml

```bash
# Set all required env vars in .env or export them
cp .env.example .env
# Edit .env with real production values

docker-compose -f docker-compose.prod.yml up -d
```

## Features

| Feature | Status |
|---|---|
| Parts Library (CRUD, search) | ✅ |
| BOM Tree (recursive, circular guard, DataLoader) | ✅ |
| Inventory (filter by part/location, low-stock highlight) | ✅ |
| Work Orders (Kanban board, step checklist, auto-complete) | ✅ |
| Dashboard (stats cards, Recharts bar chart, activity log) | ✅ |
| Authentication (email/password + Google OAuth) | ✅ |
| Input validation (Zod) | ✅ |
| API security (helmet, CORS, rate limiting, depth limit) | ✅ |
| Structured logging (pino) | ✅ |
| Error masking | ✅ |

## Connection Pooling

Prisma's built-in connection pool is configured via `DATABASE_URL` query params:

```
?connection_limit=10&pool_timeout=30
```

For higher scale, consider placing **PgBouncer** between the API and Postgres. Point `DATABASE_URL` at PgBouncer and add `?pgbouncer=true` to enable Prisma's PgBouncer compatibility mode (disables prepared statements).

## CI

GitHub Actions runs on every push:
1. **Lint** — ESLint + Prettier check
2. **Typecheck** — `tsc --noEmit` across all workspaces
3. **Unit tests** — Vitest (mocked Prisma)
4. **Integration tests** — Vitest against real test DB
5. **E2E tests** — Playwright against full docker-compose stack
