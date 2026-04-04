# SwimHoles

Public site for browsing published swimming-hole records.

## What lives here

- Public React/Vite frontend
- Public Express API that serves published records only
- Static build and prerender pipeline for the public site

All create/edit admin tools now live in the separate `swimholesadmin` project.

## Development

1. Run `npm install`
2. Copy `.env.example` to `.env`
3. Optional: set `DATABASE_URL` if the public site should read from Neon
4. Run `npm run dev`

## Ports

- Public frontend: `http://localhost:3000`
- Public API: `http://localhost:8787`

## Production-style local run

- `npm run build`
- `npm run start`
