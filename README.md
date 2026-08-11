# Delivery API

A production-shaped REST API for a food delivery platform — customers order from restaurants, restaurants manage their menus, drivers pick up and deliver orders, and everyone gets live status updates over WebSockets. Built with Node.js, TypeScript, and Express, backed by PostgreSQL via Prisma.

## Features

- **Auth** — JWT access/refresh tokens (refresh tokens stored hashed, never in plaintext), bcrypt password hashing, email verification via a hashed, expiring token sent by email.
- **Role-based access control** — `CUSTOMER`, `DRIVER`, `ADMIN`, enforced per-route.
- **Restaurants & menus** — CRUD with ownership checks, pagination, search and filtering.
- **Orders** — server-computed totals from live menu prices, an explicit status state machine (`PENDING → CONFIRMED → PREPARING → PICKED_UP → DELIVERED`, or `CANCELLED`).
- **Payments** — Stripe PaymentIntents with a signature-verified webhook.
- **Live delivery tracking** — Socket.io, JWT-authenticated handshake, per-order rooms, driver-ownership-checked location updates.
- **Background jobs** — BullMQ/Redis queues for transactional email and order-status notifications.
- **Validation & docs** — Zod schemas on every route, OpenAPI/Swagger generated from JSDoc and served at `/api/docs`.

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20, TypeScript |
| Framework | Express |
| Database | PostgreSQL, via Prisma ORM |
| Cache / queues | Redis, BullMQ |
| Real-time | Socket.io |
| Payments | Stripe |
| Validation | Zod |
| API docs | Swagger (OpenAPI 3) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Testing | Jest, ts-jest |
| Containerization | Docker, docker-compose |

## Architecture overview

Requests flow through a consistent layered pipeline:

```
routes/  → validate (Zod) → authenticate/authorize → controllers/ → services/ → prisma → PostgreSQL
```

- **`routes/`** — one file per resource, wires middleware and carries the Swagger JSDoc for each endpoint.
- **`middlewares/`** — `auth` (JWT verification), `rbac` (role checks), `validate` (Zod), centralized `error` handler, tiered rate limiting.
- **`controllers/`** — thin HTTP adapters: parse the request, call a service, shape the response. No business logic.
- **`services/`** — business logic and Prisma queries live here, framework-agnostic.
- **`validators/`** — Zod schemas, also the source of inferred DTO types used throughout.
- **`jobs/`** — BullMQ queues and workers for async work (email, order-status fan-out) so request handlers stay fast.
- **`sockets/`** — Socket.io handlers; delivery-location updates delegate into the same service the REST endpoint uses, so authorization logic isn't duplicated.
- **`config/`** — one file per external dependency (database, redis, stripe, swagger), each exporting a ready-to-use client built from the validated environment.

Environment variables are validated once at boot with a Zod schema (`src/config/env.ts`) — the process refuses to start if a required variable is missing or malformed.

## Getting started

### Prerequisites

- Docker and Docker Compose (recommended), **or** local Node.js 20+, PostgreSQL 16, and Redis 7.

### Run with Docker (recommended)

```bash
git clone <this-repo>
cd delivery-api
cp .env.example .env
# edit .env — at minimum set JWT_ACCESS_SECRET / JWT_REFRESH_SECRET (openssl rand -hex 64),
# and your Stripe / SMTP credentials if you're exercising those flows.

docker compose up -d --build
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed   # optional: sample admin/owner/customer + restaurant
```

The API is now running at `http://localhost:3002`, with docs at `http://localhost:3002/api/docs`.

### Run locally without Docker

```bash
npm install
cp .env.example .env   # point DATABASE_URL / REDIS_HOST at your local instances
npx prisma migrate dev
npm run dev
```

### Useful scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the API in watch mode |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm test` | Run the Jest test suite |
| `npm run lint` | Lint `src/` with ESLint |
| `npm run prisma:migrate` | Create/apply a dev migration |
| `npm run prisma:migrate:prod` | Apply migrations in production (`prisma migrate deploy`) |
| `npm run prisma:seed` | Seed sample users, a restaurant, and menu items |
| `npm run prisma:studio` | Open Prisma Studio |

## API documentation

Interactive Swagger UI is served at **[`/api/docs`](http://localhost:3002/api/docs)** once the server is running, generated from JSDoc annotations on every route.

## Environment variables

All variables are validated at boot (`src/config/env.ts`); the process exits immediately if one is missing or malformed. See [`.env.example`](.env.example) for a ready-to-copy template — it ships with placeholders only, never real credentials.

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | `development` \| `production` \| `test` | `development` |
| `PORT` | HTTP port | `3002` |
| `API_PREFIX` | Base path for all API routes | `/api` |
| `DATABASE_URL` | PostgreSQL connection string | — required |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | — optional |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens (min 32 chars) | — required |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens (min 32 chars) | — required |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_...`) | — required |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) | — required |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key (geocoding/ETA — currently stubbed) | — required |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Outbound email (Nodemailer) | `SMTP_PORT` defaults to `587` |
| `EMAIL_FROM` | From-address for outbound email | — required |
| `CORS_ORIGIN` | Allowed origin for browser clients | `*` |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Global rate limit window and cap | `900000` / `100` |
| `AUTH_RATE_LIMIT_MAX` | Cap for `/auth/*` endpoints in the same window | `10` |
| `LOG_LEVEL` | Winston log level | `debug` |
| `LOG_DIR` | Directory for log files | `logs` |

## Testing

```bash
npm test
```

Tests are unit-level and mock the Prisma client and job queues, so they run without a live database or Redis instance. Coverage focuses on the auth flow (registration, login, refresh-token rotation, email verification) and the order lifecycle (total computation, status transitions).

## License

MIT

## Author

**Volodymyr Petryk** — [linkedin.com/in/volodymyr-petryk](https://linkedin.com/in/volodymyr-petryk)
