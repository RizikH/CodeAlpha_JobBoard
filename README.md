# CodeAlpha JobBoard API

A RESTful Job Board API built with Node.js, Express.js, and MongoDB.

Developed as part of the Backend Development Internship at CodeAlpha (June 2026).

---

## Features

- JWT-based authentication with role-specific access (candidate, employer, admin)
- Job listing creation, search, and filtering with public read access
- Resume upload and management (PDF/Word, max 5 MB, up to 10 files per upload)
- Job application submission, tracking, and status updates
- Full admin panel with cascading soft-delete across all entities
- Soft-delete across all models — deleted records are hidden from normal queries but preserved in the database
- Rate limiting on all API routes (100 req / 15 min per user; 5 req / 15 min on auth)
- Request validation via Joi schemas on all write operations
- Interactive API documentation via Swagger UI at `/api-docs`
- Integration test suite with an isolated Docker-based MongoDB instance

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js v5 |
| Database | MongoDB via Mongoose v9 |
| Auth | JSON Web Tokens (jsonwebtoken) |
| Passwords | bcryptjs |
| Validation | Joi |
| File upload | Multer (disk in prod, memory in tests) |
| Rate limiting | express-rate-limit |
| API docs | swagger-jsdoc + swagger-ui-express |
| Testing | Jest + Supertest |
| Package manager | pnpm |

---

## Project Structure

```
├── app.js                        # Express app setup, route mounting, error handler
├── server.js                     # DB connection + server start
├── config/
│   ├── db.js                     # Mongoose connection
│   └── swagger.js                # Swagger/OpenAPI config
├── models/
│   ├── User.js                   # Auth user (email, password, role, status)
│   ├── Candidate.js              # Candidate profile (name, phone)
│   ├── Employer.js               # Employer profile (name, company, location, phone)
│   ├── Job.js                    # Job listing
│   ├── Application.js            # Job application
│   └── Resume.js                 # Uploaded resume record
├── controllers/
│   ├── authController.js
│   ├── jobController.js
│   ├── applicationController.js
│   ├── resumeController.js
│   └── adminController.js
├── services/
│   ├── authService.js
│   ├── jobService.js
│   ├── applicationService.js
│   ├── resumeService.js
│   └── adminService.js
├── routes/
│   ├── auth.js
│   ├── job.js
│   ├── application.js
│   ├── resume.js
│   └── admin.js
├── middleware/
│   ├── protect.js                # JWT verification + banned-user check
│   ├── authorizeRole.js          # Role-based access control
│   ├── upload.js                 # Multer config (PDF/Word, 5 MB, 10 files)
│   └── rateLimiter.js            # Rate limiter instances (api, auth, downloads)
├── utils/
│   ├── constants.js              # Enums: ROLES, USER_STATUS, JOB_STATUS, etc.
│   ├── response.js               # Standardised success/error response helpers
│   ├── validators/
│   │   ├── index.js              # Aggregated validator exports
│   │   ├── authValidators.js
│   │   ├── jobValidators.js
│   │   ├── applicationValidators.js
│   │   └── adminValidators.js
│   └── plugins/
│       └── softDelete.js         # Mongoose plugin: isDeleted flag + pre-find hook
├── tests/
│   ├── helpers/
│   │   ├── db.js                 # connect / clearCollections / findIncludingDeleted
│   │   ├── factories.js          # Data factories for all models
│   │   ├── authHelper.js         # JWT token/header generator for tests
│   │   ├── globalSetup.js        # Connect before test run
│   │   └── globalTeardown.js     # Drop DB + disconnect after test run
│   ├── auth/auth.test.js
│   ├── jobs/jobs.test.js
│   ├── applications/applications.test.js
│   ├── resumes/resumes.test.js
│   └── admin/admin.test.js
├── docs/
│   └── openapi.yaml              # OpenAPI 3.0 spec
├── uploads/                      # Resume files saved here in production
├── docker-compose.test.yml       # Isolated MongoDB container for tests (port 27018)
├── .env.example                  # Environment variable template
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A running MongoDB instance (local or Atlas)

### Installation

```bash
git clone <repo-url>
cd CodeAlpha_JobBoard
pnpm install
```

### Environment Variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string for the main database |
| `JWT_SECRET` | Secret key used to sign and verify JWTs |
| `PORT` | Port the server listens on (default: `5000`) |

### Run in Development

```bash
pnpm dev
```

### Run in Production

```bash
pnpm start
```

The server starts on `http://localhost:<PORT>`.  
Swagger UI is available at `http://localhost:<PORT>/api-docs`.

---

## API Endpoints

All endpoints return a consistent JSON shape:

```json
{ "success": true,  "data": { ... } }
{ "success": false, "message": "..." }
```

### Authentication — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register a new user (`candidate` or `employer` role) |
| POST | `/login` | — | Login and receive a JWT |

Registration requires: `name`, `email`, `password` (min 8 chars, upper + lower + special), `phone` (`+[code] [number]`), `role`.  
Employers also accept `company` and `location`.

---

### Jobs — `/api/jobs`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | — | List all active jobs (supports `?location`, `?jobType`, `?status`, `?title`) |
| GET | `/:id` | — | Get a single job by ID |
| GET | `/mine` | Employer | Get the authenticated employer's own listings |
| POST | `/` | Employer | Create a new job listing |
| PUT | `/:id` | Employer | Update an owned job listing |
| DELETE | `/:id` | Employer | Soft-delete an owned job listing |

---

### Applications — `/api/applications`

| Method | Path | Auth | Role behaviour |
|---|---|---|---|
| GET | `/` | Candidate / Employer | Candidates see their own; employers see applications to their jobs. Supports `?status` filter. |
| GET | `/:id` | Candidate / Employer | Candidates can only access their own; employers only their jobs'. |
| POST | `/` | Candidate | Submit an application (`jobId` required, `resume` ObjectId optional) |
| PUT | `/:id` | Candidate / Employer | Candidates: withdraws the application. Employers: set `newStatus` to `accepted` or `declined`. |
| DELETE | `/:id` | Candidate | Soft-delete an owned application |

---

### Resumes — `/api/resumes`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Candidate | List all non-deleted resumes belonging to the caller |
| GET | `/:id` | Candidate | Get a single resume record |
| GET | `/:id/download` | Authenticated | Download the resume file |
| POST | `/` | Candidate | Upload one or more files (field name: `resumes`). PDF and Word only, max 5 MB each, up to 10 files. |
| DELETE | `/:id` | Candidate | Soft-delete a resume |

---

### Admin — `/api/admin` (Admin role required)

All admin `GET` collection endpoints support `?includeDeleted=true` to include soft-deleted records.

#### Users
| Method | Path | Description |
|---|---|---|
| GET | `/user` | List users. Filters: `?role`, `?status` |
| GET | `/user/:id` | Get user by ID |
| PUT | `/user/:id` | Update user status (`active` / `banned`) |
| DELETE | `/user/:id` | Soft-delete user and cascade to their profile, resumes, applications, and jobs |

#### Candidates
| Method | Path | Description |
|---|---|---|
| GET | `/candidate` | List candidates. Filter: `?name`, `?phone` |
| GET | `/candidate/:id` | Get candidate by ID |
| DELETE | `/candidate/:id` | Soft-delete candidate and cascade to their resumes and applications |

#### Employers
| Method | Path | Description |
|---|---|---|
| GET | `/employer` | List employers. Filters: `?name`, `?company`, `?location`, `?phone` |
| GET | `/employer/:id` | Get employer by ID |
| DELETE | `/employer/:id` | Soft-delete employer and cascade to their jobs and associated applications |

#### Jobs
| Method | Path | Description |
|---|---|---|
| GET | `/job` | List jobs. Filters: `?title`, `?employer`, `?jobType`, `?status`, `?location`, `?salary` |
| GET | `/job/:id` | Get job by ID |
| DELETE | `/job/:id` | Soft-delete job and cascade to its applications |

#### Applications
| Method | Path | Description |
|---|---|---|
| GET | `/application` | List applications. Filters: `?candidate`, `?job`, `?status` |
| GET | `/application/:id` | Get application by ID |
| DELETE | `/application/:id` | Soft-delete an application |

#### Resumes
| Method | Path | Description |
|---|---|---|
| GET | `/resume` | List resumes. Filters: `?fileName`, `?candidate` |
| GET | `/resume/:id` | Get resume record by ID |
| DELETE | `/resume/:id` | Soft-delete a resume record |

---

## Running Tests

The test suite uses an isolated MongoDB instance (port `27018`) spun up via Docker.

### One-command (recommended)

Starts the Docker container, runs all tests, then tears it down:

```bash
pnpm test:full
```

### Manual (if you have MongoDB running on port 27018 already)

```bash
pnpm test
```

### Watch mode

```bash
pnpm test:watch
```

### Coverage report

```bash
pnpm test:coverage
```

### Docker container only (useful for repeated runs)

```bash
pnpm test:docker:up    # start container
pnpm test              # run tests
pnpm test:docker:down  # stop and remove container
```

Test environment variables are read from `.env.test`. The test database is dropped entirely after each run.

---

## Soft Delete

All models use a shared `softDelete` Mongoose plugin (`utils/plugins/softDelete.js`). It adds an `isDeleted: Boolean` field and attaches a `pre-find` hook that automatically excludes deleted records from all queries unless `query.setOptions({ includeDeleted: true })` is explicitly set. Admin service functions accept an `includeDeleted` parameter for this purpose.

---

## Rate Limiting

| Limiter | Window | Limit | Applied to |
|---|---|---|---|
| `api` | 15 min | 100 requests | All routes (global + admin router) |
| `auth` | 15 min | 5 requests | `POST /api/auth/login` and `/register` |
| `downloads` | 1 hour | 20 requests | Resume download endpoint |

When a user is authenticated, limits are tracked per user ID. For unauthenticated requests, limits are tracked by IP.

Rate limiting is disabled in the test environment (`NODE_ENV=test`).

---

## Internship

**Organization:** CodeAlpha  
**Role:** Backend Development Intern  
**Duration:** 1st June 2026 – 30th June 2026  
**Intern:** Rizik Haddad
