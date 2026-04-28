# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multi-tenant CRM platform with sales pipeline management, lead tracking, e-signature contracts, and task workflows. The repo is split into two independent apps: `backend/` and `frontend/`, each with their own `package.json` and `Dockerfile`.

Default seed login: `admin@demo.com` / `Admin@1234`

---

## Development Commands

### Backend (`backend/`)
```bash
npm run dev          # Start dev server with hot reload (tsx watch)
npm run build        # Compile TypeScript to dist/
npm run start        # Run compiled output
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed database with demo data
npm run db:studio    # Open Prisma Studio GUI
```

### Frontend (`frontend/`)
```bash
npm run dev          # Start Vite dev server on port 5173
npm run build        # Type-check + build to dist/
npm run preview      # Preview production build
```

### Docker (root)
```bash
docker-compose up --build          # Development stack (db + backend:3002 + frontend:8080)
docker-compose -f docker-compose.prod.yml up --build   # Production
```

---

## Environment Setup

**Backend** — copy `backend/.env.example` to `backend/.env`:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — signing secret for tokens
- `FRONTEND_URL` — for CORS (`http://localhost:5173` locally)
- `DOCUSEAL_API_KEY` / `DOCUSEAL_BASE_URL` — e-signature service
- `SMTP_*` — email credentials

**Frontend** — the Vite dev server proxies `/api` and `/uploads` to `http://localhost:3001`, so no `.env` is needed locally.

---

## Architecture

### Backend (`backend/src/`)

- **`index.ts`** — Express entry point; registers all route groups, serves `/uploads` static files, health check at `GET /api/health`
- **`lib/prisma.ts`** — Singleton PrismaClient using `@prisma/adapter-pg`
- **`middleware/auth.ts`** — JWT verification; attaches decoded payload (`id`, `orgId`, `email`, `role`) to `req.user`
- **`middleware/rbac.ts`** — Role guards: `requireRole()`, `requireAdmin()`, `requireManager()`, `requireAggregator()`. Hierarchy: `AGGREGATOR(4) > ADMIN(3) > MANAGER(2) > SALES_REP(1)`
- **`routes/`** — One file per resource; routes call Prisma directly (no separate service layer except for external integrations)
- **`services/`** — `docuseal.ts` (HTML→template, multi-signer), `email.ts` (Nodemailer), `payment.ts` (stub)

**Multi-tenancy:** Every query scopes data to `req.user.orgId`. Aggregator role can query across all orgs. Sales reps see only leads assigned to them.

### Frontend (`frontend/src/`)

- **`api/client.ts`** — Axios instance; reads JWT from Zustand store and sets `Authorization: Bearer` header; redirects to `/login` on 401/403
- **`api/*.ts`** — One module per resource, each exports typed async functions
- **`store/authStore.ts`** — Zustand store persisted to `localStorage` under key `crm-auth`; holds `token` + `user` object
- **`App.tsx`** — React Router v6 route tree with `RequireAuth` (redirect to login) and `RequireGuest` (redirect to `/`) guards
- **`pages/LeadDetail.tsx`** — Central hub: 4-tab view (Overview, Tasks, Documents, Contracts & Payments)
- **`pages/ContractTemplates.tsx`** — Uses Jodit rich-text editor for HTML contract templates with placeholder variables
- **`components/kanban/`** — Drag-and-drop pipeline board via `@dnd-kit`

### Database (Prisma schema — 11 models)

Key relationships:
- `Organisation` → `User`, `Pipeline`, `Lead`, `TaskTemplate`, `ContractTemplate`
- `Pipeline` → `PipelineStage` (types: `NORMAL`, `WON`, `LOST`)
- `Lead` → `Task`, `Document`, `Contract`, `Payment`
- `Contract` references a `ContractTemplate` and stores rendered HTML + multi-signer status

### Contract Template Placeholders

Templates support `{{lead.*}}` and `{{signer.*}}` variables (e.g. `{{lead.name}}`, `{{signer.1.name}}`). Rendering and DocuSeal submission happen in `backend/src/routes/contracts.ts` and `backend/src/services/docuseal.ts`.

---

## Key Patterns

- **No tests exist** — the project has no test framework configured
- **File uploads** — Multer stores files in `backend/src/uploads/`; they're served statically and proxied through Nginx in production
- **E-signatures** — The `Sign` page (`/sign/:token`) is publicly accessible (no auth required); it polls the DocuSeal API
- **Maps** — Leads have `latitude`/`longitude` fields; React Leaflet renders them in `LeadDetail`
