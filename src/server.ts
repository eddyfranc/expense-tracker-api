import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/index.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Expense Tracker API running on http://localhost:${env.PORT}`);
  console.log(`📚 Swagger Documentation available at http://localhost:${env.PORT}/api/docs`);
  console.log(`🩺 Health Check endpoint at http://localhost:${env.PORT}/api/v1/health`);
});

// Graceful Shutdown Handlers
async function shutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log("🔒 HTTP server closed.");
    try {
      await pool.end();
      console.log("📦 PostgreSQL connection pool drained.");
      process.exit(0);
    } catch (err) {
      console.error("❌ Error during database pool shutdown:", err);
      process.exit(1);
    }
  });

  // Force shutdown if takes too long
  setTimeout(() => {
    console.error("⚠️ Forcefully shutting down due to timeout...");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
