import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../config/env.js";
import * as schema from "./schema/index.js";

const isProduction = env.NODE_ENV === "production";
const isLocal =
  env.DATABASE_URL.includes("localhost") ||
  env.DATABASE_URL.includes("127.0.0.1") ||
  env.DATABASE_URL.includes("@postgres:") ||
  env.DATABASE_URL.includes("@expense_tracker_postgres:");

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: isProduction && !isLocal ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;
