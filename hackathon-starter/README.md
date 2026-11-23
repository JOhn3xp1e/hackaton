# CampusFix: app source

This folder holds the CampusFix app: `client/` (React), `server/` (Express), `api/` (the Vercel entry) and `database/` (SQL).

**The full documentation is in the [repository README](../README.md):** features, setup, configuration, demo accounts, data model, API and deployment.

Quick start (from this folder):

```bash
npm run setup
cp client/.env.example client/.env      # Supabase URL + anon key
cp server/.env.example server/.env      # Supabase URL + service key (+ optional AI keys)
# Run database/schema.sql, then database/seed.sql, in the Supabase SQL editor
npm run seed:demo --prefix server       # optional demo accounts + data
npm run dev                             # http://localhost:5173
```

> The files in `docs/` date from the original starter kit, and some of them (e.g. `API_CONTRACT.md`) describe its example API rather than CampusFix.
