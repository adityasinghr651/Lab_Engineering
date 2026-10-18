# DevFlow — Engineering Project & Issue Management API

<p align="center">
  <strong>A backend platform for structured project management, issue tracking, and team collaboration.</strong>
</p>

<p align="center">
  Built with Node.js, Express.js, PostgreSQL, JWT Authentication, and Zod.
</p>

<p align="center">
  <!-- Replace or remove badges if they do not match the repository -->
  ![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=nodedotjs&logoColor=white)
  ![Express.js](https://img.shields.io/badge/Express.js-API-black?logo=express)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)
  ![JavaScript](https://img.shields.io/badge/JavaScript-CommonJS-F7DF1E?logo=javascript&logoColor=black)
  ![Testing](https://img.shields.io/badge/Tests-52%20passing%20at%20last%20verified%20snapshot-brightgreen)
</p>

---

## Overview

DevFlow is a backend engineering project designed to manage projects, issues, assignments, and collaborative discussions through a structured REST API.

The project focuses on more than CRUD operations. It explores backend engineering concepts such as authentication, authorization, relational data integrity, request validation, database access patterns, pagination, and automated integration testing.

The codebase uses a layered architecture to separate HTTP handling, business logic, data access, and database operations.

> **Project status:** The core feature phases have been implemented. Security and production-readiness hardening is a separate step; this README should be updated after the latest fixes and tests are verified.

## Table of contents

- [Key features](#key-features)
- [System architecture](#system-architecture)
- [Database design](#database-design)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [API reference](#api-reference)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Testing](#testing)
- [Security and reliability](#security-and-reliability)
- [Engineering decisions](#engineering-decisions)
- [Roadmap](#roadmap)
- [Author](#author)

## Key features

### 1. Authentication and user identity

- User registration and login.
- Password hashing using `bcryptjs`.
- JWT-based authentication.
- Protected identity endpoint.
- Role-aware authorization design.

### 2. Project management

- Create, retrieve, update, and delete projects.
- Project ownership and administrative permissions.
- Normalized project keys and uniqueness checks.
- Relational data integrity.

### 3. Issue management

- Create and retrieve issues.
- Associate issues with projects.
- Track creators and assignees.
- Filter issues by supported attributes.
- Update and delete issues according to authorization rules.

### 4. Comments and collaboration

- Add comments to issues.
- Retrieve issue discussions.
- Associate comments with their authors.
- Apply author/admin deletion rules.
- Preserve relational integrity when parent records are deleted.

### 5. Search, sorting, and pagination

- Case-insensitive text search across issue titles and descriptions.
- Sorting by supported fields.
- Ascending and descending ordering.
- Page-based and offset-based pagination.
- Total-result metadata for paginated requests.
- Backward-compatible unpaginated responses.

### 6. Backend observability

- Optional request logging using `ENABLE_REQUEST_LOGGING`.
- Experimental PostgreSQL pool/query timing instrumentation using `TRACK_POOL_METRICS`.
- Centralized error handling.
- Health-check endpoint.

## System architecture

The application follows a layered backend architecture.

```mermaid
flowchart TD
    Client["Client / API Consumer"]
    Routes["Express Routes"]
    Middleware["Authentication and Validation Middleware"]
    Controller["Controllers"]
    Service["Business Logic Services"]
    Repository["Data Access Repositories"]
    Pool["PostgreSQL Connection Pool"]
    DB[("PostgreSQL Database")]
    Errors["Centralized Error Handler"]

    Client --> Routes
    Routes --> Middleware
    Middleware --> Controller
    Controller --> Service
    Service --> Repository
    Repository --> Pool
    Pool --> DB

    Routes -. errors .-> Errors
    Middleware -. errors .-> Errors
    Controller -. errors .-> Errors
    Service -. errors .-> Errors
    Repository -. errors .-> Errors
    Errors --> Client
```

### Request lifecycle

1. A client sends an HTTP request to an API endpoint.
2. Express routes direct the request to the appropriate middleware and controller.
3. Validation middleware checks supported request inputs.
4. Controllers translate HTTP input into service calls.
5. Services enforce business rules and relationship checks.
6. Repositories execute parameterized database operations.
7. PostgreSQL stores or retrieves the data.
8. The API returns a structured response or a centralized error response.

### Why use layers?

| Layer | Responsibility |
|---|---|
| Routes | Endpoint definitions and middleware composition |
| Middleware | Authentication, validation, and request processing |
| Controllers | HTTP request and response handling |
| Services | Business rules and authorization decisions |
| Repositories | SQL queries and data access |
| PostgreSQL | Persistent storage and relational constraints |

This separation makes the system easier to test, maintain, and extend without mixing SQL, HTTP handling, and business rules in a single file.

## Database design

The application uses PostgreSQL and relational constraints to represent users, projects, issues, and comments.

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : owns
    USERS ||--o{ ISSUES : creates
    USERS ||--o{ ISSUES : assigned_to
    PROJECTS ||--o{ ISSUES : contains
    ISSUES ||--o{ COMMENTS : has
    USERS ||--o{ COMMENTS : writes

    USERS {
        integer id PK
        string name
        string email
        string password_hash
        string role
    }

    PROJECTS {
        integer id PK
        string name
        string key
        integer owner_id FK
    }

    ISSUES {
        integer id PK
        string title
        string description
        string status
        string priority
        integer project_id FK
        integer creator_id FK
        integer assignee_id FK
    }

    COMMENTS {
        integer id PK
        integer issue_id FK
        integer author_id FK
        string body
    }
```

*Note: This is a conceptual relationship diagram. Verify exact column names, data types, constraints, and optional relationships against `src/db/schema.sql` before publishing.*

### Data integrity principles

- Use foreign keys for valid relationships.
- Use parameterized queries to separate SQL from user input.
- Enforce uniqueness where the domain requires it.
- Validate input before performing database operations.
- Use transactions for operations that must succeed or fail together.

## Technology stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | HTTP API framework |
| PostgreSQL | Relational database |
| `pg` | PostgreSQL client and connection pooling |
| JWT / `jsonwebtoken` | Token-based authentication |
| `bcryptjs` | Password hashing |
| Zod | Request validation |
| Node.js test runner | Automated test execution |

## Project structure

The following is an indicative structure. Keep it aligned with the actual repository rather than creating files solely to match this diagram.

```text
DevFlow/
├── server.js
├── package.json
├── package-lock.json
├── .env.example
├── src/
│   ├── app.js
│   ├── config/
│   │   ├── index.js
│   │   └── db.js
│   ├── db/
│   │   └── schema.sql
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── project.routes.js
│   │   ├── issue.routes.js
│   │   └── comment.routes.js
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── middleware/
│   └── validators/
└── tests/
    ├── auth.test.js
    ├── project.test.js
    ├── issue.test.js
    ├── comment.test.js
    └── search.test.js
```

## API reference

The following table summarizes the reported endpoint families. Confirm exact paths, request schemas, status codes, and authorization requirements against the current implementation before treating this as a definitive API contract.

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register an account |
| POST | `/auth/login` | Authenticate and obtain a token |
| GET | `/auth/me` | Retrieve the authenticated user's identity |

### Projects

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/projects` | Create a project |
| GET | `/projects` | List accessible projects |
| GET | `/projects/:id` | Retrieve a project |
| PUT | `/projects/:id` | Update a project |
| DELETE | `/projects/:id` | Delete a project |

### Issues

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/issues` | List, filter, search, sort, or paginate issues |
| POST | `/issues` | Create an issue |
| GET | `/issues/:id` | Retrieve an issue |
| PUT | `/issues/:id` | Update an issue |
| DELETE | `/issues/:id` | Delete an issue |
| GET | `/projects/:projectId/issues` | List issues for a project |
| POST | `/projects/:projectId/issues` | Create an issue within a project |

### Comments

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/issues/:issueId/comments` | List issue comments |
| POST | `/issues/:issueId/comments` | Add a comment |
| DELETE | `/issues/:issueId/comments/:commentId` | Delete a comment, subject to authorization |

### Search and pagination example

```http
GET /issues?search=authentication&sortBy=createdAt&order=desc&limit=10&page=1
```

Depending on the query parameters, the API supports a flat array for unpaginated requests or a paginated response containing data and metadata.

Illustrative response shape:

```json
{
  "data": [
    {
      "id": 12,
      "title": "Improve authentication error handling"
    }
  ],
  "pagination": {
    "total": 24,
    "limit": 10,
    "page": 1,
    "totalPages": 3,
    "hasMore": true
  }
}
```

The values above are examples, not a claim about current database contents.

## Getting started

### Prerequisites

- A supported Node.js version.
- PostgreSQL.
- Git.
- npm.

### 1. Clone the repository

```bash
git clone <YOUR_PUBLIC_GITHUB_REPOSITORY_URL>
cd <YOUR_REPOSITORY_DIRECTORY>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local `.env` file using `.env.example` as a reference.

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/devflow

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d

ENABLE_REQUEST_LOGGING=true
TRACK_POOL_METRICS=false
```

Use values appropriate to your local PostgreSQL installation and the actual configuration parser. Never commit real credentials or production secrets.

### 4. Initialize the database

Create a PostgreSQL database and apply the schema using the repository's documented database setup process.

For example, if the schema is self-contained and compatible with your local database:

```bash
psql "$DATABASE_URL" -f src/db/schema.sql
```

If the project uses migrations or additional setup scripts, follow those instead. Avoid repeatedly applying a schema that is not designed to be rerun.

### 5. Start the server

```bash
npm start
```

If no start script is configured in `package.json`, use the repository's actual development or startup command.

### 6. Run the tests

```bash
npm test
```

Integration tests require a correctly configured test database. Follow the repository's test setup and never point destructive test fixtures at production data.

## Environment variables

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Controls the application environment |
| `PORT` | HTTP server port |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign and verify tokens (fail-fast enforced in prod) |
| `JWT_EXPIRES_IN` | Token expiry configuration |
| `DB_POOL_MAX` | Maximum PostgreSQL client pool size (default: 20) |
| `DB_IDLE_TIMEOUT_MS` | Inactive connection idle timeout in milliseconds (default: 30000) |
| `DB_CONNECTION_TIMEOUT_MS` | Connection acquisition timeout in milliseconds (default: 5000) |
| `ENABLE_REQUEST_LOGGING` | Enables or disables request logging |
| `TRACK_POOL_METRICS` | Enables optional repository pool/query metrics |

The exact variable names and defaults match `src/config/index.js`, `src/config/db.js`, and the current implementation.

## Testing

At the last reported verification snapshot, the project had 62 passing automated tests across five suites.

| Suite | Reported tests |
|---|---:|
| Authentication | 13 |
| Projects | 11 |
| Issues | 19 |
| Comments | 10 |
| Search, sorting, and pagination | 9 |
| **Total** | **62** |

These results describe that particular snapshot, not necessarily the current working tree. Rerun the full test suite after subsequent code changes before updating the badge or publishing fresh results.

### What should be tested?

- Successful and rejected authentication.
- Authorization boundaries between users and administrators.
- Valid and invalid project relationships.
- Issue creation, assignment, update, and deletion.
- Comment ownership and deletion permissions.
- Case-insensitive search and combined filters.
- Pagination metadata and sorting behaviour.
- Database errors and invalid input.
- Concurrent operations where data consistency matters.

## Security and reliability

Security is part of the implementation process, not a feature that can be established by a passing test count alone.

Before describing DevFlow as production-ready, verify:

- Public registration cannot grant administrative privileges.
- Protected mutations enforce authentication and resource-level authorization.
- Production startup fails safely when required secrets are missing or insecure.
- Database connection and query timeouts are configured appropriately.
- Sensitive database errors and secrets are not exposed to clients or logs.
- Login attempts are rate-limited.
- Pagination uses deterministic ordering.
- Shutdown handles active requests within a bounded deadline.
- Development-only diagnostic endpoints are disabled or removed in production.

**Current limitation:** These controls must be checked against the latest code. Do not claim they are all resolved until the relevant fixes and regression tests are complete.

## Engineering decisions

### Why PostgreSQL?

The domain contains relationships between users, projects, issues, and comments. PostgreSQL provides relational constraints, transactions, and query capabilities suitable for these relationships.

### Why a repository layer?

Centralizing database access separates SQL from HTTP controllers and business logic. It also gives the team a clear place to review query behaviour and database performance.

### Why request validation?

Validation rejects malformed inputs early and makes API contracts more explicit. Validation complements—but does not replace—authorization, database constraints, or business rules.

### Why pagination?

Returning every matching record can increase database work, response size, and memory consumption as the dataset grows. Pagination gives clients control over how much data is returned per request.

### Why automated integration tests?

Unit-level checks alone may not catch problems involving routing, authentication middleware, SQL constraints, and real database behaviour. Integration tests help verify these components together.

## Roadmap

- [ ] Complete security and reliability hardening.
- [ ] Verify resource-level authorization on every mutation.
- [ ] Add deterministic pagination and boundary-case tests.
- [ ] Finalize database timeout and shutdown behaviour.
- [ ] Document all API request/response schemas and status codes.
- [ ] Add reproducible performance benchmarks with clearly stated test conditions.
- [ ] Publish architecture diagrams and real API screenshots.
- [ ] Add CI checks for tests and linting.
- [ ] Document deployment, database migrations, and operational monitoring.

Only mark items complete after verifying the implementation.

## Screenshots and diagrams

Store genuine project visuals in a directory such as `docs/images/` and reference them using relative paths.

Suggested assets:

| Asset | Suggested filename | Purpose |
|---|---|---|
| Architecture diagram | `docs/images/system-architecture.png` | Explain the request lifecycle |
| Database diagram | `docs/images/database-er.png` | Show entities and relationships |
| API examples | `docs/images/api-examples.png` | Demonstrate real API requests and responses |
| Test output | `docs/images/test-results.png` | Show a recent, reproducible test run |
| Monitoring output | `docs/images/metrics-dashboard.png` | Show actual metrics, if a dashboard exists |

For example, after creating the image:

```markdown
![DevFlow system architecture](docs/images/system-architecture.png)
```

Do not add invented screenshots, fabricated benchmark charts, or UI images that do not represent the actual project.

## Contributing

Contributions are welcome. Before submitting changes:

1. Read the existing code and architecture.
2. Keep controllers, services, and repositories focused on their responsibilities.
3. Validate new inputs and enforce authorization.
4. Add regression tests for changed behaviour.
5. Run the full test suite.
6. Document API changes.

## License

A license has not been specified here. Add a `LICENSE` file and update this section only after selecting the license you intend to publish under.

## Author

**Aditya Singh**

B.Tech Computer Science Engineering — AI, ML & Robotics

- GitHub: [adityasinghr651](https://github.com/adityasinghr651)
- LinkedIn: [Aditya Singh](https://www.linkedin.com/in/aditya-singh-rathore-261201225/)
- Codolio: [Coding profile](https://codolio.com/profile/adityasinghr651)

---

*DevFlow is a backend engineering project focused on maintainable API design, relational data integrity, authentication, and testing. Features, test results, and operational guarantees should always be described according to the latest verified implementation.*