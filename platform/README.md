# Platform

NestJS service for MortgageModeler — handles users, authentication, and scenario persistence. Backed by PostgreSQL via Prisma.

Part of the three-service architecture (see the [root README](../README.md)). Runs on port 3001.

## Local development

Postgres must be running from the repo root:

```bash
docker compose up -d
```

Then from this directory:

```bash
npm install
cp .env.example .env
npx prisma generate
npm run start:dev
```

The dev server watches for changes and restarts automatically. Visit [http://localhost:3001](http://localhost:3001) to hit the default route.

## Prisma

```bash
npx prisma migrate dev --name <change>   # create + apply a migration in dev
npx prisma generate                      # regenerate client after schema edits
npx prisma studio                        # open browser-based DB explorer
```

Schema lives in [`prisma/schema.prisma`](./prisma/schema.prisma). Migrations are written to `prisma/migrations/` and committed.

## Tech

- NestJS 11 + TypeScript (CommonJS)
- Prisma 6 ORM + PostgreSQL 16
- Config loading via `@nestjs/config` + `.env`

## Tests

```bash
npm run test        # unit tests
npm run test:e2e    # end-to-end
npm run test:cov    # coverage
```
