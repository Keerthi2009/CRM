# CRM — Setup Guide

## Stack
- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Frontend**: React + TypeScript + Vite + Material UI + Zustand

---

## Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally (or remote)
- npm or pnpm

---

## 1. Backend Setup

```bash
cd backend
npm install
```

### Configure environment
```bash
cp .env.example .env
```
Edit `.env` and set your `DATABASE_URL`:
```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/crm_db"
JWT_SECRET="any-long-random-string"
```

### Run migrations + seed
```bash
npx prisma migrate dev --name init
npm run db:seed
```

### Start backend
```bash
npm run dev        # development (hot reload)
# or
npm run build && npm start  # production
```
Backend runs on **http://localhost:3001**

---

## 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Frontend runs on **http://localhost:5173**  
API calls are proxied to `http://localhost:3001` automatically.

---

## 3. Login

| Field    | Value            |
|----------|------------------|
| Email    | admin@demo.com   |
| Password | Admin@1234       |

---

## 4. DocuSeal (e-signing)
- Sign up at https://docuseal.com for a free API key
- Add `DOCUSEAL_API_KEY` to backend `.env`
- Without a key, contract sending works in **stub mode** (logs to console, no real email)

---

## 5. File Uploads
Files are stored in `backend/uploads/` on disk.  
The folder is created automatically on first upload.

---

## Project Structure

```
React app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # DB schema (10 models)
│   │   └── seed.ts             # Demo data
│   └── src/
│       ├── index.ts            # Express app entry
│       ├── middleware/
│       │   ├── auth.ts         # JWT verification
│       │   └── rbac.ts         # Role-based access
│       ├── routes/             # 12 route files
│       └── services/           # DocuSeal, Payment stubs
└── frontend/
    └── src/
        ├── api/                # 10 typed API modules
        ├── components/         # Layout, Kanban, common UI
        ├── pages/              # 9 pages
        ├── store/              # Zustand auth store
        └── types/              # Shared TypeScript types
```

---

## API Reference (key endpoints)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login → JWT |
| POST | `/api/auth/register` | Register user |
| GET | `/api/dashboard` | Stats for current user |
| GET/POST | `/api/pipelines` | List / create pipelines |
| POST | `/api/pipelines/:id/stages` | Add stage to pipeline |
| GET/POST | `/api/leads` | List / create leads |
| PUT | `/api/leads/:id/stage` | Move lead to stage (kanban) |
| GET/POST | `/api/leads/:id/tasks` | Lead tasks |
| PUT | `/api/leads/:id/tasks/:taskId/complete` | Toggle task complete |
| GET/POST | `/api/leads/:id/documents` | Upload / list docs |
| GET/POST | `/api/leads/:id/contracts` | Contracts |
| POST | `/api/leads/:id/contracts/:cid/send` | Send to DocuSeal |
| GET/POST | `/api/leads/:id/payments` | Payment records |
| GET/POST | `/api/task-templates` | Task templates |
| POST | `/api/task-templates/:id/apply/:leadId` | Apply template to lead |
| GET/POST/PUT/DELETE | `/api/users` | User management (Admin) |
| GET/PUT | `/api/organisations/:id` | Org management |
| POST | `/api/webhooks/docuseal` | DocuSeal signature webhook |
