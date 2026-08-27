import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { pool } from "./db/index.js";
import { apiRateLimiter } from "./middleware/rate-limiter.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { NotFoundError } from "./utils/errors.js";
import { openApiSpec } from "./docs/openapi.js";

// Import Module Routers
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import categoryRoutes from "./modules/categories/category.routes.js";
import expenseRoutes from "./modules/expenses/expense.routes.js";
import incomeRoutes from "./modules/income/income.routes.js";
import reportRoutes from "./modules/reports/report.routes.js";
import budgetRoutes from "./modules/budgets/budget.routes.js";
import subscriptionRoutes from "./modules/subscriptions/subscription.routes.js";

export function createApp(): Express {
  const app = express();

  // Security & Utility Middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  if (env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  // Rate Limiting
  app.use("/api", apiRateLimiter);

  // Swagger Documentation
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

  // Health Check Endpoint
  app.get("/api/v1/health", async (_req: Request, res: Response) => {
    try {
      // Test DB connection
      await pool.query("SELECT 1");
      res.status(200).json({
        success: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        version: "1.0.0",
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown database error",
      });
    }
  });

  // API Routes Mount
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/categories", categoryRoutes);
  app.use("/api/v1/expenses", expenseRoutes);
  app.use("/api/v1/income", incomeRoutes);
  app.use("/api/v1/reports", reportRoutes);
  app.use("/api/v1/budgets", budgetRoutes);
  app.use("/api/v1/subscriptions", subscriptionRoutes);

  // 404 Route Handler
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
