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

## Docker Deployment (Local)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Files added

```
CRM/
├── docker-compose.yml         # Orchestrates postgres, backend, frontend
├── .env.docker.example        # Template for Docker env vars
├── backend/
│   ├── Dockerfile             # Multi-stage Node.js build
│   └── .dockerignore
└── frontend/
    ├── Dockerfile             # Multi-stage React + Nginx build
    ├── nginx.conf             # Proxies /api and /uploads to backend
    └── .dockerignore
```

### Run with Docker Compose

```bash
# 1. Copy and fill in secrets
cp .env.docker.example .env.docker

# 2. Build and start all services
docker compose --env-file .env.docker up --build -d

# 3. Seed demo data (first run only)
docker compose exec backend npm run db:seed
```

The app is now available at **http://localhost**

To stop:

```bash
docker compose down
```

To wipe the database volume too:

```bash
docker compose down -v
```

### Services

| Service | Container port | Exposed at |
|---|---|---|
| Frontend (Nginx) | 80 | http://localhost |
| Backend (Express) | 3001 | Internal only |
| PostgreSQL | 5432 | Internal only |

> **Note:** Migrations run automatically on backend startup via `npx prisma migrate deploy`.

---

## AWS Deployment (Docker + ECS Fargate + RDS)

This guide uses **Amazon ECR** (container registry), **ECS Fargate** (serverless containers), **RDS** (managed PostgreSQL), and an **Application Load Balancer**.

### Architecture

```
Internet → ALB (port 80/443)
               ├── /* → ECS Frontend Task (Nginx)
               └── /api/* → ECS Backend Task (Express)
                                  └── RDS PostgreSQL
```

### Prerequisites

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) configured (`aws configure`)
- Docker Desktop running

---

### Step 1 — Create ECR repositories

```bash
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

aws ecr create-repository --repository-name crm-backend  --region $AWS_REGION
aws ecr create-repository --repository-name crm-frontend --region $AWS_REGION
```

### Step 2 — Build and push images

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS \
    --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Backend
docker build -t crm-backend ./backend
docker tag  crm-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/crm-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/crm-backend:latest

# Frontend (nginx proxies /api to the backend ALB URL — see Step 5)
docker build -t crm-frontend ./frontend
docker tag  crm-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/crm-frontend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/crm-frontend:latest
```

### Step 3 — Create RDS PostgreSQL

1. Open **AWS Console → RDS → Create database**
2. Engine: **PostgreSQL 16**, template: **Free tier** (dev) or **Production**
3. DB instance identifier: `crm-db`
4. Set a master username / password
5. Enable **Public access: No** (keep it inside the VPC)
6. Note the **endpoint** (e.g. `crm-db.xxxxxx.us-east-1.rds.amazonaws.com`)
7. After creation, connect and create the database:

```bash
psql -h <RDS_ENDPOINT> -U postgres -c "CREATE DATABASE crm_db;"
```

### Step 4 — Store secrets in AWS Parameter Store

```bash
aws ssm put-parameter --name /crm/DATABASE_URL \
  --value "postgresql://postgres:<PASSWORD>@<RDS_ENDPOINT>:5432/crm_db" \
  --type SecureString

aws ssm put-parameter --name /crm/JWT_SECRET \
  --value "<your-long-random-secret>" \
  --type SecureString
```

### Step 5 — Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name crm-cluster --region $AWS_REGION
```

### Step 6 — Create ECS Task Definitions

**Backend task** (`backend-task.json`):

```json
{
  "family": "crm-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/crm-backend:latest",
      "portMappings": [{ "containerPort": 3001 }],
      "environment": [
        { "name": "PORT", "value": "3001" },
        { "name": "JWT_EXPIRES_IN", "value": "7d" },
        { "name": "FRONTEND_URL", "value": "https://<your-domain>" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "/crm/DATABASE_URL" },
        { "name": "JWT_SECRET",   "valueFrom": "/crm/JWT_SECRET" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/crm-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

```bash
aws ecs register-task-definition --cli-input-json file://backend-task.json
```

**Frontend task** — same structure but:
- image: `crm-frontend:latest`
- containerPort: `80`
- no secrets needed

> **Important:** Before building the final frontend image for AWS, update `frontend/nginx.conf` — replace `proxy_pass http://backend:3001` with `proxy_pass http://<BACKEND_ALB_DNS>` so the nginx container can reach the backend service.

### Step 7 — Create Application Load Balancer

1. **AWS Console → EC2 → Load Balancers → Create ALB**
2. Create two **Target Groups**:
   - `crm-frontend-tg` → port 80, health check `/`
   - `crm-backend-tg`  → port 3001, health check `/api/auth/me` (expects 401, not 5xx)
3. **Listener rules** (port 80):
   - `Path /api/*` → forward to `crm-backend-tg`
   - `Path /uploads/*` → forward to `crm-backend-tg`
   - `Default` → forward to `crm-frontend-tg`
4. For HTTPS (recommended): add port 443 listener with an ACM certificate

### Step 8 — Create ECS Services

```bash
# Backend service
aws ecs create-service \
  --cluster crm-cluster \
  --service-name crm-backend \
  --task-definition crm-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_IDS>],securityGroups=[<SG_ID>],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=<BACKEND_TG_ARN>,containerName=backend,containerPort=3001"

# Frontend service (same pattern, containerPort=80)
aws ecs create-service \
  --cluster crm-cluster \
  --service-name crm-frontend \
  --task-definition crm-frontend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_IDS>],securityGroups=[<SG_ID>],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=<FRONTEND_TG_ARN>,containerName=frontend,containerPort=80"
```

### Step 9 — Seed the database

Run the seed once using ECS Exec (or a temporary Fargate task):

```bash
aws ecs execute-command \
  --cluster crm-cluster \
  --task <BACKEND_TASK_ARN> \
  --container backend \
  --interactive \
  --command "npm run db:seed"
```

### Step 10 — Access the app

Open the ALB DNS name in your browser (e.g. `http://crm-alb-xxxx.us-east-1.elb.amazonaws.com`).

Login with the seeded credentials:

| Email | Password | Role |
|---|---|---|
| `admin@demo.com` | `Admin@1234` | ADMIN |
| `aggregator@platform.com` | `Aggregator@1234` | AGGREGATOR |

---

### Deploying updates

```bash
# Rebuild and push the updated image
docker build -t crm-backend ./backend
docker tag  crm-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/crm-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/crm-backend:latest

# Force ECS to pull the new image
aws ecs update-service --cluster crm-cluster --service crm-backend --force-new-deployment
```

---

### AWS Cost estimate (us-east-1, minimal setup)

| Resource | Spec | ~Monthly cost |
|---|---|---|
| ECS Fargate (2 tasks) | 0.5 vCPU / 1 GB each | ~$15 |
| RDS PostgreSQL | db.t3.micro, 20 GB | ~$15 |
| ALB | 1 LCU average | ~$18 |
| ECR storage | < 1 GB | ~$0.10 |
| **Total** | | **~$48/month** |

> Use **Free Tier** resources (RDS t3.micro, single Fargate task) to reduce costs during development.

---

## Production Deployment (manual / non-Docker)

### Backend
1. Set all required env vars on the server
2. Run `npm run build`
3. Run `npx prisma migrate deploy`
4. Start with `npm start` or `pm2 start dist/index.js`

### Frontend
1. Run `npm run build` → outputs to `dist/`
2. Serve `dist/` with Nginx, Vercel, Netlify, or any static host

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
