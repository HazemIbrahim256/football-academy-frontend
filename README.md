# Football Academy — Frontend (Next.js)

Standalone Next.js app (App Router) for the Football Academy. Connects to the Django API via `NEXT_PUBLIC_API_URL`.

## Requirements

- Node.js 18+

## Setup

1) Install dependencies

- `npm install`

2) Configure environment

- Copy `.env.local.example` to `.env.local` and set:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

3) Run in development

- `npm run dev` (default `http://localhost:3000`)

## Build & Start

- `npm run build`
- `npm run start` (serves the built app)

## Notes

- Ensure the backend allows your origin via CORS for production deployments.
- PDF downloads and media URLs are fetched directly from the backend base URL.

## Deployment Checklist (Production)

- Set environment:
  - `NEXT_PUBLIC_API_URL=https://<your-api-domain>`
- Build the app: `npm run build`
- Deploy to your host (Vercel/Netlify/Static hosting/Container)
- Ensure backend CORS includes your frontend origin:
  - `DJANGO_CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>`
- If using HTTPS/proxies and admin forms, backend should set:
  - `DJANGO_CSRF_TRUSTED_ORIGINS=https://<your-frontend-domain>`