# Backend API

Production backend for the e-commerce application.

## Local Setup

1. Install dependencies with `npm install`.
2. Copy `.env.production.example` to `.env.production` for deployment values, or define a local `.env` for development.
3. Run database migrations with `npm run db:migrate`.
4. Start the API with `npm run dev`.

## Optional Dev Seeding

Database seeding is disabled in production. To seed a local admin account, set `ALLOW_DEV_SEED=true` and provide `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`, then run `npm run db:seed`.

## Production Notes

- Keep `NODE_ENV=production` in deployed environments.
- Provide real values for database, JWT, email, storage, and payment credentials.
- Do not enable dev seeding in production.
