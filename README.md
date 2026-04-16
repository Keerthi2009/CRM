# CRM Platform

A full-featured Customer Relationship Management (CRM) web application built with a modern TypeScript stack. Manage leads through visual pipelines, track tasks, handle documents, create contract templates with e-signatures, and record payments — all in one place.

---

## Features

- **Dashboard** — Real-time KPIs: total leads, won/lost counts, conversion rate, pipeline breakdown
- **Pipeline Management** — Create multiple pipelines with custom stages (Normal / Won / Lost)
- **Lead Management** — Table view + drag-and-drop Kanban board
- **Lead Detail (4 tabs)**
  - **Overview** — Edit lead info, address geocoding, interactive map (OpenStreetMap)
  - **Tasks** — Checklists, due dates, apply task templates in one click
  - **Documents** — Upload, download, and delete files (up to 20 MB each)
  - **Contracts & Payments** — Template-driven contract wizard with multi-signer e-signing (DocuSeal), PDF download, payment tracking
- **Contract Templates** — Rich HTML editor (Jodit) with lead & signer placeholder system; supports up to 5 signers per template with signature, initials, and date fields
- **Task Templates** — Reusable step-by-step checklists to apply to any lead
- **User Management** — Create users per organisation, assign roles, manage access
- **Organisation Management** — Aggregator can view all organisations and create new ones; Admin can edit their own org
- **Role-Based Access Control** — Four roles (Aggregator → Admin → Manager → Sales Rep)
- **JWT Authentication** — Secure login with token-based sessions; no public self-registration

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| TypeScript | Type safety |
| Prisma ORM v7 | Database access & migrations |
| PostgreSQL | Relational database |
| `@prisma/adapter-pg` | Prisma 7 driver adapter |
| JWT (jsonwebtoken) | Authentication |
| bcryptjs | Password hashing |
| Multer | File upload handling |
| DocuSeal API | E-signature integration (multi-signer) |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool & dev server |
| Material UI (MUI v5) | Component library |
| Zustand | Global state management |
| Axios | HTTP client |
| Jodit React | Rich text / HTML contract editor |
| html2pdf.js | Client-side PDF generation |
| @dnd-kit | Drag-and-drop Kanban |
| React Leaflet | Interactive maps |
| Nominatim | Address geocoding (free) |
| Notistack | Toast notifications |
| React Router v6 | Client-side routing |

---

## Project Structure

```
CRM/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (11 models)
│   │   ├── seed.ts                # Demo data seeder
│   │   └── migrations/            # Prisma migration history
│   ├── prisma.config.ts           # Prisma 7 config (datasource URL)
│   ├── src/
│   │   ├── index.ts               # Express app entry point
│   │   ├── lib/
│   │   │   └── prisma.ts          # Shared PrismaClient with pg adapter
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT verification middleware
│   │   │   └── rbac.ts            # Role-based access control (4 roles)
│   │   ├── routes/
│   │   │   ├── auth.ts            # Login, /me
│   │   │   ├── dashboard.ts       # Stats & recent leads
│   │   │   ├── pipelines.ts       # Pipeline + stage CRUD
│   │   │   ├── leads.ts           # Lead CRUD + stage move
│   │   │   ├── tasks.ts           # Task CRUD + complete toggle
│   │   │   ├── documents.ts       # File upload / download
│   │   │   ├── contracts.ts       # Contract CRUD + multi-signer send
│   │   │   ├── contractTemplates.ts # Contract template CRUD
│   │   │   ├── payments.ts        # Payment record CRUD
│   │   │   ├── organisations.ts   # Org settings + create (Aggregator)
│   │   │   ├── users.ts           # User management (cross-org for Aggregator)
│   │   │   ├── taskTemplates.ts   # Template CRUD + apply to lead
│   │   │   └── webhooks.ts        # DocuSeal signature webhook
│   │   └── services/
│   │       ├── docuseal.ts        # DocuSeal API (multi-signer, HTML→template)
│   │       └── payment.ts         # Payment stub (Stripe-ready)
│   ├── uploads/                   # Uploaded files (auto-created)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── client.ts          # Axios instance + JWT interceptor
    │   │   ├── auth.ts
    │   │   ├── dashboard.ts
    │   │   ├── leads.ts
    │   │   ├── pipelines.ts
    │   │   ├── tasks.ts
    │   │   ├── documents.ts
    │   │   ├── contracts.ts
    │   │   ├── contractTemplates.ts
    │   │   ├── payments.ts
    │   │   ├── taskTemplates.ts
    │   │   └── users.ts
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Layout.tsx
    │   │   │   ├── Sidebar.tsx    # Navigation (role-aware)
    │   │   │   └── TopBar.tsx
    │   │   ├── kanban/
    │   │   │   ├── KanbanBoard.tsx
    │   │   │   └── KanbanCard.tsx
    │   │   ├── leads/
    │   │   │   └── LeadForm.tsx
    │   │   └── common/
    │   │       ├── ConfirmDialog.tsx
    │   │       ├── EmptyState.tsx
    │   │       └── LoadingSpinner.tsx
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   └── Login.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── Pipelines.tsx
    │   │   ├── Leads.tsx
    │   │   ├── LeadDetail.tsx     # 4-tab lead page + contract wizard
    │   │   ├── ContractTemplates.tsx  # Jodit editor + placeholder panel
    │   │   ├── TaskTemplates.tsx
    │   │   ├── Organisations.tsx  # Aggregator: list + create; Admin: own org
    │   │   └── Users.tsx          # Aggregator: cross-org; Admin: own org
    │   ├── store/
    │   │   └── authStore.ts
    │   ├── types/
    │   │   ├── index.ts
    │   │   └── html2pdf.d.ts
    │   ├── App.tsx
    │   └── main.tsx
    ├── index.html
    ├── vite.config.ts
    ├── package.json
    └── tsconfig.json
```

---

## Prerequisites

- **Node.js** v20 or higher → [nodejs.org](https://nodejs.org)
- **npm** v9+ (bundled with Node.js)
- **PostgreSQL** v14 or higher → [postgresql.org](https://www.postgresql.org/download/)

---

## Getting Started

### Step 1 — Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/crm-platform.git
cd crm-platform
```

### Step 2 — Set up the Backend

```bash
cd backend
npm install
```

#### Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
# Required
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/crm_db"
JWT_SECRET="super-secret-jwt-key-change-me"

# Optional
JWT_EXPIRES_IN="7d"
PORT=3001
DOCUSEAL_API_KEY="your-docuseal-api-key"
DOCUSEAL_BASE_URL="https://api.docuseal.com"
FRONTEND_URL="http://localhost:5173"
```

#### Create the database

```bash
psql -U postgres -c "CREATE DATABASE crm_db;"
```

#### Run database migrations

```bash
npx prisma migrate dev --name init
```

#### Seed demo data

```bash
npm run db:seed
```

This creates:

| Account | Email | Password | Role |
|---|---|---|---|
| Aggregator | `aggregator@platform.com` | `Aggregator@1234` | AGGREGATOR |
| Admin | `admin@demo.com` | `Admin@1234` | ADMIN |

Plus: Demo Org, Sales Pipeline (6 stages), and two Task Templates.

#### Start the backend

```bash
npm run dev
```

Backend runs at **http://localhost:3001**

---

### Step 3 — Set up the Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

---

## Role-Based Access Control

Four roles with a strict hierarchy: **AGGREGATOR (4) > ADMIN (3) > MANAGER (2) > SALES REP (1)**

| Feature | Aggregator | Admin | Manager | Sales Rep |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| View all Leads | ✅ | ✅ | ✅ | Own only |
| Create / Edit Leads | ✅ | ✅ | ✅ | ✅ |
| Manage Pipelines | ✅ | ✅ | ✅ | ❌ |
| Task & Contract Templates | ✅ | ✅ | ✅ | ❌ |
| Create Contracts / Payments | ✅ | ✅ | ✅ | ❌ |
| Manage Users (own org) | ✅ | ✅ | ❌ | ❌ |
| Manage Users (any org) | ✅ | ❌ | ❌ | ❌ |
| Organisation Settings | ✅ | ✅ | ❌ | ❌ |
| Create New Organisations | ✅ | ❌ | ❌ | ❌ |
| View All Organisations | ✅ | ❌ | ❌ | ❌ |

> **Note:** There is no public self-registration. All users are created by an Admin (for their own org) or an Aggregator (for any org).

---

## Contract Templates

Templates are created in **Contract Templates** (sidebar) using the Jodit rich-text editor.

### Placeholders

Insert tokens into the template by clicking the placeholder panel or copying and pasting:

**Lead fields**

| Token | Resolves to |
|---|---|
| `{{lead.name}}` | Lead's full name |
| `{{lead.email}}` | Lead's email |
| `{{lead.phone}}` | Lead's phone |
| `{{lead.company}}` | Lead's company |
| `{{lead.address}}` | Lead's address |
| `{{lead.value}}` | Lead's deal value |

**Signer fields** (repeat for `signer2`, `signer3`, … up to `signer5`)

| Token | Renders as |
|---|---|
| `{{signer1.name}}` | Signer's full name |
| `{{signer1.email}}` | Signer's email |
| `{{signer1.signature}}` | Signature field placeholder |
| `{{signer1.initials}}` | Initials field placeholder |
| `{{signer1.date}}` | Signed date field |

### Contract Wizard (Lead → Contracts tab)

1. **Step 1 — Select Template** — pick from saved templates
2. **Step 2 — Configure Signers** — fill name & email for each signer defined in the template (dynamically shows only as many forms as the template requires)
3. **Step 3 — Preview** — rendered HTML with all placeholders resolved; download as PDF
4. **Send for Signature** — creates a DocuSeal submission with all signers; emails sent automatically; contract status moves `DRAFT → SENT`
5. **Webhook** — when all signers complete, DocuSeal calls `POST /api/webhooks/docuseal` and status updates to `COMPLETED`

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | — | Login → JWT token |
| `GET` | `/api/auth/me` | Required | Current user info |

### Dashboard
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/dashboard` | Required | Stats, stage breakdown, recent leads |

### Pipelines
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/pipelines` | List pipelines |
| `POST` | `/api/pipelines` | Create pipeline |
| `PUT` | `/api/pipelines/:id` | Update pipeline |
| `DELETE` | `/api/pipelines/:id` | Delete pipeline |
| `POST` | `/api/pipelines/:id/stages` | Add stage |
| `PUT` | `/api/pipelines/:id/stages/:stageId` | Update stage |
| `DELETE` | `/api/pipelines/:id/stages/:stageId` | Delete stage |

### Leads
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/leads` | List leads (filter by pipeline, stage, search) |
| `POST` | `/api/leads` | Create lead |
| `GET` | `/api/leads/:id` | Get lead |
| `PUT` | `/api/leads/:id` | Update lead |
| `DELETE` | `/api/leads/:id` | Delete lead |
| `PUT` | `/api/leads/:id/stage` | Move lead to a different stage |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/leads/:leadId/tasks` | List tasks |
| `POST` | `/api/leads/:leadId/tasks` | Create task |
| `PUT` | `/api/leads/:leadId/tasks/:taskId` | Update task |
| `PUT` | `/api/leads/:leadId/tasks/:taskId/complete` | Toggle complete |
| `DELETE` | `/api/leads/:leadId/tasks/:taskId` | Delete task |

### Documents
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/leads/:leadId/documents` | List documents |
| `POST` | `/api/leads/:leadId/documents` | Upload file (multipart/form-data) |
| `DELETE` | `/api/leads/:leadId/documents/:docId` | Delete document |

### Contracts
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/leads/:leadId/contracts` | List contracts |
| `POST` | `/api/leads/:leadId/contracts` | Create contract (`title`, `templateId?`, `content?`, `signers?`) |
| `PUT` | `/api/leads/:leadId/contracts/:contractId` | Update contract |
| `POST` | `/api/leads/:leadId/contracts/:contractId/send` | Send for e-signing (multi-signer) |
| `DELETE` | `/api/leads/:leadId/contracts/:contractId` | Delete contract |

### Contract Templates
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/contract-templates` | List templates |
| `GET` | `/api/contract-templates/:id` | Get template (includes full HTML content) |
| `POST` | `/api/contract-templates` | Create template (`name`, `content`, `signerCount`) |
| `PUT` | `/api/contract-templates/:id` | Update template |
| `DELETE` | `/api/contract-templates/:id` | Delete template |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/leads/:leadId/payments` | List payments |
| `POST` | `/api/leads/:leadId/payments` | Record payment |
| `PUT` | `/api/leads/:leadId/payments/:paymentId` | Update payment |
| `DELETE` | `/api/leads/:leadId/payments/:paymentId` | Delete payment |

### Task Templates
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/task-templates` | List templates |
| `POST` | `/api/task-templates` | Create template |
| `PUT` | `/api/task-templates/:id` | Update template |
| `DELETE` | `/api/task-templates/:id` | Delete template |
| `POST` | `/api/task-templates/:id/apply/:leadId` | Apply template to lead |

### Users
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | List users (`?orgId=` for Aggregator) |
| `POST` | `/api/users` | Create user (`orgId` required for Aggregator) |
| `PUT` | `/api/users/:id` | Update user |
| `DELETE` | `/api/users/:id` | Delete user |

### Organisations
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/organisations` | List all orgs (public, used for dropdowns) |
| `POST` | `/api/organisations` | Create org (Aggregator only) |
| `GET` | `/api/organisations/:id` | Get org details |
| `PUT` | `/api/organisations/:id` | Update org name (Admin) |

### Webhooks
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/webhooks/docuseal` | Receive DocuSeal signature events |

---

## Database Schema

```
Organisation  ──< User
           │──< Pipeline ──< PipelineStage
           │──< Lead ──────────────────────< Task
           │            │                 < Document
           │            │                 < Contract ──< Payment
           │            │                 < Payment
           │──< TaskTemplate
           └──< ContractTemplate ──< Contract
```

**Models:** Organisation, User, Pipeline, PipelineStage, Lead, Task, TaskTemplate, Document, ContractTemplate, Contract, Payment

---

## Integrations

### DocuSeal (E-Signing)
- Sign up at [docuseal.com](https://docuseal.com) for a free tier
- Add `DOCUSEAL_API_KEY` to `.env`
- Without a key the app runs in **stub mode** — contracts are saved but no emails are sent
- Multi-signer support: each signer gets their own email with a signing link
- Contract HTML is uploaded to DocuSeal as a template, then a submission is created for all signers
- Webhook `POST /api/webhooks/docuseal` marks contracts `COMPLETED` or `DECLINED` automatically

### Maps & Geocoding
- Uses **OpenStreetMap** + **Leaflet.js** — no API key required
- Address geocoding via **Nominatim** (free, rate-limited to 1 req/sec)

### Payments
- Implemented as manual payment records — no payment gateway required
- The service layer in `backend/src/services/payment.ts` is ready for **Stripe** integration

---

## Available Scripts

### Backend
```bash
npm run dev          # Start in watch mode
npm run build        # Compile TypeScript to dist/
npm start            # Run production build
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed demo accounts and data
npm run db:studio    # Open Prisma Studio
```

### Frontend
```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | ❌ | `7d` | Token expiry |
| `PORT` | ❌ | `3001` | Backend port |
| `DOCUSEAL_API_KEY` | ❌ | — | DocuSeal API key |
| `DOCUSEAL_BASE_URL` | ❌ | `https://api.docuseal.com` | DocuSeal base URL |
| `FRONTEND_URL` | ❌ | `http://localhost:5173` | Allowed CORS origin |

---

## Production Deployment

### Backend
1. Set all required env vars on the server
2. Run `npm run build`
3. Run `npx prisma migrate deploy`
4. Start with `npm start` or `pm2 start dist/index.js`

### Frontend
1. Set `VITE_API_URL` if the API is on a different domain
2. Run `npm run build` → outputs to `dist/`
3. Serve `dist/` with Nginx, Vercel, Netlify, or any static host

---

## Prisma 7 Notes

This project uses **Prisma 7**, which requires:

- **`prisma.config.ts`** in the backend root — holds the `datasource.url` (replaces the `url` field in `schema.prisma`)
- **`@prisma/adapter-pg`** — driver adapter passed to `PrismaClient` at runtime
- The `datasource` block in `schema.prisma` only contains `provider = "postgresql"` (no `url`)

If you upgrade Prisma in the future, refer to the [Prisma 7 migration guide](https://pris.ly/d/prisma7-client-config).

---

## License

MIT — feel free to use, modify, and distribute.

---

*Built with Express, Prisma 7, React, Material UI, Jodit, and DocuSeal*
