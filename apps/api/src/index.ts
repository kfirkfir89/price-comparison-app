/**
 * API Gateway Entry Point
 * Price Comparison Platform
 *
 * This is the main entry point for the API Gateway service.
 * It initializes the Fastify application and starts the HTTP server.
 */

// Load environment variables FIRST (before any other imports that use process.env)
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory of this file and resolve .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../../.env");
dotenv.config({ path: envPath });

import { buildApp } from "./app.js";
import { loadConfig } from "./config/index.js";

// TODO: Uncomment when Sentry is configured
// import './instrument.js'; // Sentry must be imported first

/**
 * Start the API Gateway server
 */
async function start(): Promise<void> {
  const config = loadConfig();
  const port = config.env.API_PORT;
  const host = "0.0.0.0";

  try {
    // Build the Fastify application
    const app = await buildApp();

    // Start listening
    await app.listen({ port, host });

    // Log startup information
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🏪 Price Comparison API Gateway                             ║
║                                                               ║
║   Server running at: http://${host}:${port}                     ║
║   Environment: ${config.env.NODE_ENV.padEnd(10)}                            ║
║   Documentation: http://${host}:${port}/documentation           ║
║                                                               ║
║   Features:                                                   ║
║   • Local Shopping: ${config.env.FEATURE_LOCAL_SHOPPING ? "✅ Enabled " : "❌ Disabled"}                          ║
║   • Global Shopping: ${config.env.FEATURE_GLOBAL_SHOPPING ? "✅ Enabled " : "❌ Disabled"}                         ║
║   • Smart Recommendations: ${config.env.FEATURE_SMART_RECOMMENDATIONS ? "✅ Enabled " : "❌ Disabled"}                   ║
║   • Vector Search: ${config.env.FEATURE_VECTOR_SEARCH ? "✅ Enabled " : "❌ Disabled"}                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);

    // Graceful shutdown handlers
    const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

    for (const signal of signals) {
      process.on(signal, async () => {
        console.log(`\n📤 Received ${signal}, shutting down gracefully...`);
        try {
          await app.close();
          console.log("✅ Server closed successfully");
          process.exit(0);
        } catch (err) {
          console.error("❌ Error during shutdown:", err);
          process.exit(1);
        }
      });
    }
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

// Start the server
start();
