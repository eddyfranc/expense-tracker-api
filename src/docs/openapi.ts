export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Expense Tracker REST API",
    version: "1.0.0",
    description:
      "A production-grade REST API for managing personal expenses, tracking income, categorizing transactions, and generating financial analytics and reports. Built with Node.js, Express, TypeScript, PostgreSQL, Drizzle ORM, and Zod.",
    contact: {
      name: "API Support",
    },
  },
  servers: [
    {
      url: "http://localhost:3000/api/v1",
      description: "Local Development Server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT access token in the format: Bearer <token>",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "ValidationError" },
              message: { type: "string", example: "Request validation failed" },
              details: { type: "object" },
            },
          },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["email", "password", "firstName", "lastName"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          password: { type: "string", format: "password", example: "SecurePass123!" },
          firstName: { type: "string", example: "John" },
          lastName: { type: "string", example: "Doe" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          password: { type: "string", format: "password", example: "SecurePass123!" },
        },
      },
      RefreshTokenRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5..." },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", example: "123e4567-e89b-12d3-a456-426614174000" },
          userId: { type: "string", format: "uuid", nullable: true },
          name: { type: "string", example: "Food & Dining" },
          description: { type: "string", nullable: true, example: "Groceries and restaurants" },
          color: { type: "string", nullable: true, example: "#FF5733" },
          icon: { type: "string", nullable: true, example: "utensils" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Expense: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440000" },
          userId: { type: "string", format: "uuid" },
          categoryId: { type: "string", format: "uuid" },
          amount: { type: "number", example: 45.5 },
          amountCents: { type: "integer", example: 4550 },
          description: { type: "string", example: "Dinner with friends" },
          expenseDate: { type: "string", format: "date-time", example: "2026-08-27T19:30:00Z" },
          category: { $ref: "#/components/schemas/Category" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Income: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          amount: { type: "number", example: 3500.0 },
          amountCents: { type: "integer", example: 350000 },
          source: { type: "string", example: "Monthly Salary" },
          description: { type: "string", example: "Direct deposit from company" },
          incomeDate: { type: "string", format: "date-time", example: "2026-08-01T00:00:00Z" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MonthlyReport: {
        type: "object",
        properties: {
          year: { type: "integer", example: 2026 },
          month: { type: "integer", example: 8 },
          totalIncome: { type: "number", example: 3500.0 },
          totalExpenses: { type: "number", example: 1250.75 },
          balance: { type: "number", example: 2249.25 },
          savingsRatePercentage: { type: "number", example: 64.26 },
          expenseCount: { type: "integer", example: 18 },
          incomeCount: { type: "integer", example: 2 },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check API and database health",
        responses: {
          200: {
            description: "API is healthy and connected to database",
          },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: { description: "User registered successfully" },
          400: { $ref: "#/components/schemas/ErrorResponse" },
          409: { description: "Email already registered" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Log in with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: { description: "Logged in successfully, returns tokens" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Authentication"],
        summary: "Rotate and refresh access tokens",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshTokenRequest" },
            },
          },
        },
        responses: {
          200: { description: "New token pair generated" },
          401: { description: "Invalid or revoked refresh token" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Revoke refresh token / log out",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshTokenRequest" },
            },
          },
        },
        responses: {
          200: { description: "Logged out successfully" },
        },
      },
    },
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Get current user profile",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Current user profile" },
          401: { description: "Unauthorized" },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update current user profile",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Profile updated" },
        },
      },
    },
    "/expenses": {
      get: {
        tags: ["Expenses"],
        summary: "List user expenses with filtering and pagination",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "year", in: "query", schema: { type: "integer" } },
          { name: "month", in: "query", schema: { type: "integer" } },
          { name: "categoryId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "from", in: "query", schema: { type: "string", format: "date" } },
          { name: "to", in: "query", schema: { type: "string", format: "date" } },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["expense_date", "-expense_date", "amount", "-amount", "created_at", "-created_at"] } },
        ],
        responses: {
          200: { description: "Paginated list of expenses" },
        },
      },
      post: {
        tags: ["Expenses"],
        summary: "Create a new expense",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount", "categoryId", "expenseDate"],
                properties: {
                  amount: { type: "number", example: 35.5 },
                  categoryId: { type: "string", format: "uuid" },
                  description: { type: "string", example: "Lunch" },
                  expenseDate: { type: "string", format: "date", example: "2026-08-27" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Expense created" },
        },
      },
    },
    "/reports/monthly": {
      get: {
        tags: ["Reports"],
        summary: "Get monthly income, expenses, and net balance summary",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "year", in: "query", required: true, schema: { type: "integer", example: 2026 } },
          { name: "month", in: "query", required: true, schema: { type: "integer", example: 8 } },
        ],
        responses: {
          200: {
            description: "Monthly summary report",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/MonthlyReport" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/reports/monthly/categories": {
      get: {
        tags: ["Reports"],
        summary: "Get monthly spending breakdown by category with percentage calculations",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "year", in: "query", required: true, schema: { type: "integer", example: 2026 } },
          { name: "month", in: "query", required: true, schema: { type: "integer", example: 8 } },
        ],
        responses: {
          200: { description: "Category spending breakdown" },
        },
      },
    },
    "/budgets": {
      get: {
        tags: ["Budgets"],
        summary: "List monthly category budget targets with actual spent progress",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "year", in: "query", schema: { type: "integer" } },
          { name: "month", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "List of budgets with spending progress" },
        },
      },
      post: {
        tags: ["Budgets"],
        summary: "Create or update category monthly budget limit",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["categoryId", "year", "month", "amount"],
                properties: {
                  categoryId: { type: "string", format: "uuid" },
                  year: { type: "integer", example: 2026 },
                  month: { type: "integer", example: 8 },
                  amount: { type: "number", example: 400.0 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Budget set successfully" },
        },
      },
    },
    "/subscriptions": {
      get: {
        tags: ["Subscriptions"],
        summary: "List recurring subscriptions, monthly burn rate, and upcoming renewals",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["active", "paused", "cancelled"] } },
        ],
        responses: {
          200: { description: "Subscriptions list and summary" },
        },
      },
      post: {
        tags: ["Subscriptions"],
        summary: "Track new recurring subscription or bill",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "categoryId", "amount", "nextBillingDate"],
                properties: {
                  name: { type: "string", example: "Netflix Premium" },
                  categoryId: { type: "string", format: "uuid" },
                  amount: { type: "number", example: 19.99 },
                  billingCycle: { type: "string", enum: ["weekly", "monthly", "yearly"], example: "monthly" },
                  nextBillingDate: { type: "string", format: "date", example: "2026-09-01" },
                  status: { type: "string", enum: ["active", "paused", "cancelled"], example: "active" },
                  description: { type: "string", example: "Family 4K plan" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Subscription created" },
        },
      },
    },
  },
};
