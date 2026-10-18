# DevFlow — Engineering Project & Issue Management API

<p align="center">
  <strong>A high-reliability backend platform for structured project management, issue tracking, and collaborative discussion.</strong><br/>
  Built with Node.js 22 · Express 5 · PostgreSQL 16 · JWT Authentication · Zod Validation
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" alt="Express 5"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Auth-JWT-7C3AED" alt="JWT authentication"/>
  <img src="https://img.shields.io/badge/Validation-Zod-3068B7" alt="Zod validation"/>
  <img src="https://img.shields.io/badge/Tests-62%20passing-brightgreen" alt="Tests"/>
</p>

<p align="center">
  <img src="docs/images/devflow-hero-animated.gif" alt="DevFlow Animated Architecture & Relational Engine Showcase" width="100%" />
</p>

---

## Overview

DevFlow is an engineering-grade backend REST API providing core project tracking and collaboration capabilities. Designed as a production-minded architecture case study, it implements strict layered separation of concerns, secure authentication and authorization guards, relational integrity with cascading actions, deterministic search and pagination, and connection pool lifecycle management.

## Key Features

- **Authentication & Identity:** User registration enforcing `member` role by default, password hashing with `bcryptjs` (10 rounds), signed JWT tokens, and fail-fast validation on insecure production secrets.
- **Login Brute-Force Protection:** Sliding-window rate limiting on `/api/auth/login` (5 attempts / 15 minutes) with standard `Retry-After` headers.
- **Project Workspaces:** Scoped project containers with normalized unique keys, relational ownership, and role-based update/deletion checks.
- **Issue Tracking & Assignment:** Fine-grained issue states (`open`, `in_progress`, `resolved`, `closed`), multi-level priority queues, creator attribution, and safe nullable assignment.
- **Threaded Collaboration:** Issue discussion comments preserving relational integrity on parent deletion (`CASCADE`).
- **Deterministic Search & Pagination:** Case-insensitive `ILIKE` text search, multi-attribute filtering, dynamic sorting, page/offset pagination with total result count metadata, and deterministic secondary ordering (`ORDER BY ..., i.id ASC`).
- **Connection Pool Lifecycle:** PostgreSQL pool management with bounded connection timeouts (5s), idle limits (30s), active utilization metrics, and 10s bounded graceful shutdown (`SIGTERM`/`SIGINT`).

---

## System Architecture

The application follows a strict 6-tier layered backend architecture separating HTTP entry, security guards, business logic, data access, and database connection pooling.

<p align="center">
  <img src="docs/images/system-architecture.gif" alt="Animated DevFlow Request Lifecycle" width="100%" />
</p>

```mermaid
flowchart TD
    Client["Client / API Consumer (JSON & Bearer JWT)"]
    Routes["Express 5 Routes (/auth, /projects, /issues, /comments)"]
    Middleware["Security Guards (Rate Limiter, JWT Auth, Zod Validator)"]
    Controllers["Request Controllers (Request Parsing & Response Formatting)"]
    Services["Domain Services (Business Rules, RBAC & State Logic)"]
    Repositories["Data Access Repositories (Parameterized SQL Queries)"]
    Pool["PostgreSQL Connection Pool (max: 20, timeout: 5s)"]
    DB[("PostgreSQL 16 Database")]

    Client --> Routes
    Routes --> Middleware
    Middleware --> Controllers
    Controllers --> Services
    Services --> Repositories
    Repositories --> Pool
    Pool --> DB
```

---

## Database Design

DevFlow uses PostgreSQL 16 with relational constraints, foreign key referential integrity rules, unique constraints, and dedicated query performance indexes.

<p align="center">
  <img src="docs/images/database-er.png" alt="DevFlow Relational Database Schema" width="100%" />
</p>

### Relational Schema Summary

| Table | Primary Key | Foreign Keys & Actions | Indexes | Purpose |
|---|---|---|---|---|
| `users` | `id` (SERIAL) | — | `email` (UNIQUE) | User identity, credentials, and RBAC roles |
| `projects` | `id` (SERIAL) | `owner_id` &rarr; `users.id` (ON DELETE CASCADE) | `key` (UNIQUE), `owner_id` | Project workspaces and team ownership |
| `issues` | `id` (SERIAL) | `project_id` &rarr; `projects.id` (CASCADE)<br/>`created_by` &rarr; `users.id` (CASCADE)<br/>`assigned_to` &rarr; `users.id` (SET NULL) | `project_id`, `status`, `priority`, `created_at` | Task and bug tracking |
| `comments` | `id` (SERIAL) | `issue_id` &rarr; `issues.id` (CASCADE)<br/>`author_id` &rarr; `users.id` (CASCADE) | `issue_id`, `author_id` | Issue threaded discussion |

---

## API Execution Workflow

The animated demonstration below showcases a verified end-to-end developer workflow executed against the test database:

<p align="center">
  <img src="docs/images/api-demo.gif" alt="Animated DevFlow API Request & Response Workflow" width="100%" />
</p>

### Endpoint Catalog

| Method | Endpoint | Description | Authorization |
|---|---|---|---|
| `POST` | `/auth/register` | Register new user account (forces `role: member`) | Public |
| `POST` | `/auth/login` | Authenticate credentials and receive Bearer JWT | Public (Rate-limited) |
| `GET` | `/auth/me` | Fetch authenticated identity | Bearer Token |
| `POST` | `/projects` | Create a new project workspace | Authenticated |
| `GET` | `/projects` | List projects with owner metadata | Authenticated |
| `GET` | `/projects/:id` | Fetch project details by ID | Authenticated |
| `PUT` | `/projects/:id` | Update project details | Owner / Admin |
| `DELETE`| `/projects/:id` | Delete project and cascade child issues | Owner / Admin |
| `POST` | `/issues` | Create an issue with creator and assignee | Authenticated |
| `GET` | `/issues` | Search, filter, sort, and paginate issues | Optional Auth |
| `GET` | `/issues/:id` | Retrieve single issue with project details | Optional Auth |
| `PUT` | `/issues/:id` | Update status, priority, or fields | Creator / Owner / Admin |
| `DELETE`| `/issues/:id` | Delete an issue and cascade comments | Creator / Owner / Admin |
| `POST` | `/issues/:id/comments` | Add a comment to an issue thread | Authenticated |
| `GET` | `/issues/:id/comments` | Retrieve comments for an issue | Public / Accessible |
| `DELETE`| `/issues/:id/comments/:commentId` | Delete a comment | Author / Admin |
| `GET` | `/health` | Service health check | Public |

---

## Technology Stack

| Layer / Concern | Technology | Purpose |
|---|---|---|
| **Runtime & HTTP** | Node.js 22 LTS + Express 5 | Asynchronous REST API routing & middleware |
| **Database** | PostgreSQL 16 + `pg` | Relational persistence & connection pooling |
| **Authentication** | `jsonwebtoken` + `bcryptjs` | Stateless JWT tokens & salted password hashing |
| **Validation** | `zod` | Declarative request payload & query parsing |
| **Test Runner** | Native Node.js Test Runner (`node:test`) | Automated integration testing with zero external dependencies |

---

## Getting Started

### Prerequisites
- Node.js 22 LTS or newer
- PostgreSQL 16 or newer

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/adityasinghr651/Lab_Engineering.git
cd Lab_Engineering/project

# 2. Install dependencies
npm ci

# 3. Configure environment variables
cp .env.example .env
```

### Environment Configuration (`.env`)

```ini
PORT=3000
NODE_ENV=development
JWT_SECRET=super-secure-production-ready-secret-min-32-chars
DATABASE_URL=postgres://postgres:postgres@localhost:5432/devflow
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT_MS=30000
DB_POOL_CONNECTION_TIMEOUT_MS=5000
ENABLE_REQUEST_LOGGING=true
TRACK_POOL_METRICS=true
SHUTDOWN_TIMEOUT_MS=10000
```

### Database Initialization & Run

```bash
# Initialize schema and seed test data
npm run db:init

# Start the development server
npm start
```

---

## Automated Testing

DevFlow includes a full automated integration test suite running directly against a live PostgreSQL database (`devflow_test`) using the native Node.js test runner (`node --test --test-concurrency=1`).

<p align="center">
  <img src="docs/images/test-results.png" alt="DevFlow Automated Test Results" width="100%" />
</p>

```bash
npm test
```

### Verified Test Run Summary

| Test Suite | Total Tests | Status |
|---|---:|:---:|
| Authentication & Identity API (`test/auth.test.js`) | 8 | PASS |
| Security Hardening & Rate Limiting (`test/security.test.js`) | 9 | PASS |
| Issues Management & Assignment (`test/issues.test.js`) | 20 | PASS |
| Project Workspaces & RBAC (`test/projects.test.js`) | 11 | PASS |
| Search, Sorting & Deterministic Pagination (`test/search_pagination.test.js`) | 14 | PASS |
| **Total Automated Tests** | **62 / 62** | **100% PASS** |

---

## Security & Reliability Hardening

- **Public Role Privilege Escalation Prevention:** Public registration routes force `role: member`. Administrative privileges can only be granted via internal administrative operations or database migrations.
- **Resource Ownership Authorization:** Non-admin users cannot mutate or delete projects, issues, or comments owned by other users.
- **Deterministic Pagination:** Ties in pagination ordering are broken using primary key tie-breakers (`i.id ASC`) to eliminate duplicate or missing items across page boundaries.
- **Production Guardrails:** Server immediately fails fast on startup if `JWT_SECRET` is unset or matches the insecure fallback in `production`.
- **Bounded Graceful Shutdown:** 10-second timeout watchdog ensures active in-flight requests complete before disconnecting the database pool and terminating cleanly.

---

## Author

**Aditya Singh**
- GitHub: [@adityasinghr651](https://github.com/adityasinghr651)
- LinkedIn: [Aditya Singh](https://www.linkedin.com/in/aditya-singh-rathore-261201225/)
- Codolio: [Coding Profile](https://codolio.com/profile/adityasinghr651)