# Expense Tracker REST API

A production-grade, modular, layered REST API for personal expense and income tracking, featuring strict multi-tenant user isolation, SQL aggregations for financial reporting, schema-driven validation with Zod, JWT-based authentication with token rotation, and OpenAPI / Swagger documentation.

---

## 🏗️ Architecture & Technology Stack

```text
┌─────────────────────────────────────────────────────────────┐
│                       Clients / Swagger UI                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express REST API Layer                   │
│   (Helmet, CORS, Rate Limiter, Morgan, Error & Auth Middlewares) │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Controllers & Routes                    │
│      (auth, users, categories, expenses, income, reports)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        Service Layer                        │
│          (Business logic, Authorization, Calculations)      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Repository Layer                       │
│           (Drizzle ORM Queries & SQL Aggregations)          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL 16 Database                  │
└─────────────────────────────────────────────────────────────┘
```

- **Runtime & Language**: Node.js v20+ / TypeScript (Strict Mode)
- **Web Framework**: Express.js
- **Database**: PostgreSQL 16 (via Docker Compose)
- **ORM & Migrations**: Drizzle ORM + Drizzle Kit
- **Validation**: Zod (Type inference + runtime schema verification)
- **Authentication**: JWT (Access Token + Refresh Token with rotation)
- **Security**: Password hashing with bcrypt, Helmet headers, CORS, Rate Limiting
- **Documentation**: Swagger UI & OpenAPI 3.0 at `/api/docs`
- **Testing**: Jest + Supertest

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20+)
- [Docker](https://www.docker.com/) (for PostgreSQL)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 4. Start PostgreSQL with Docker
```bash
docker compose up -d
```

### 5. Generate & Run Database Migrations
```bash
npm run db:generate
npm run db:push
```

### 6. Start the Development Server
```bash
npm run dev
```

The API will start at:
- **Base URL**: `http://localhost:3000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:3000/api/docs`
- **Health Check**: `http://localhost:3000/api/v1/health`

---

## 📡 API Endpoints Overview

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register user & seed default categories |
| `POST` | `/api/v1/auth/login` | Login with email & password |
| `POST` | `/api/v1/auth/refresh` | Rotate and issue new access token |
| `POST` | `/api/v1/auth/logout` | Revoke refresh token |

### 👤 User Profile (`/api/v1/users`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/users/me` | Get authenticated user profile |
| `PATCH` | `/api/v1/users/me` | Update name / profile details |
| `POST` | `/api/v1/users/me/change-password` | Change user password |

### 🏷️ Categories (`/api/v1/categories`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/categories` | List user & default categories |
| `POST` | `/api/v1/categories` | Create custom category |
| `GET` | `/api/v1/categories/:id` | Get single category |
| `PATCH` | `/api/v1/categories/:id` | Update custom category |
| `DELETE` | `/api/v1/categories/:id` | Delete unused category |

### 💸 Expenses (`/api/v1/expenses`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/expenses` | Create new expense |
| `GET` | `/api/v1/expenses` | List expenses (supports filtering, sorting & pagination) |
| `GET` | `/api/v1/expenses/:id` | Get single expense with category details |
| `PATCH` | `/api/v1/expenses/:id` | Update expense |
| `DELETE` | `/api/v1/expenses/:id` | Delete expense |

#### Supported Query Parameters for `GET /api/v1/expenses`:
- `year`: e.g. `2026`
- `month`: e.g. `8`
- `categoryId`: UUID of category
- `from`: e.g. `2026-08-01`
- `to`: e.g. `2026-08-31`
- `q`: Search keyword matching description
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `sort`: `expense_date`, `-expense_date`, `amount`, `-amount`, `created_at`, `-created_at`

### 💰 Income (`/api/v1/income`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/income` | Create income entry |
| `GET` | `/api/v1/income` | List income with filtering & pagination |
| `GET` | `/api/v1/income/:id` | Get single income entry |
| `PATCH` | `/api/v1/income/:id` | Update income entry |
| `DELETE` | `/api/v1/income/:id` | Delete income entry |

### 📊 Reports & Aggregations (`/api/v1/reports`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/reports/monthly?year=2026&month=8` | Aggregated total income, expenses, net balance, and savings rate |
| `GET` | `/api/v1/reports/monthly/categories?year=2026&month=8` | Category spending breakdown with percentages |
| `GET` | `/api/v1/reports/summary?from=2026-01-01&to=2026-12-31` | Custom date-range financial summary |

---

## 🧪 Testing

Run the automated test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run TypeScript compiler type-check:
```bash
npm run typecheck
```

---

## 🛡️ Key Design Decisions

1. **Integer Minor Units for Money**:
   All monetary amounts are stored internally as integer cents (e.g. `$45.50` stored as `4550` cents) to completely eliminate floating-point rounding errors. API responses conveniently output both decimal `amount` and integer `amountCents`.

2. **Strict Multi-Tenant Isolation**:
   Every database query filters by `userId`, guaranteeing that users cannot read, edit, or delete another user's financial transactions.

3. **Layered Modular Architecture**:
   Clear separation of concerns between Controllers, Services, Repositories, Schemas, and Middlewares facilitates easy maintenance and future extensions (e.g. adding budgets, recurring subscriptions, or export to CSV/PDF).
