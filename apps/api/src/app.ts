/**
 * Fastify Application Setup
 * Configures and creates the Fastify instance with all plugins
 */

import Fastify, { FastifyInstance, FastifyServerOptions } from "fastify";
import { loadConfig, type ApiConfig } from "./config/index.js";

// Plugins
import { mongodbPlugin } from "./plugins/mongodb.js";
import { redisPlugin } from "./plugins/redis.js";
import { corsPlugin } from "./plugins/cors.js";
import { swaggerPlugin } from "./plugins/swagger.js";

// Routes
import { registerRoutes } from "./routes/index.js";

// Middleware
import { errorHandler } from "./middleware/error-handler.js";

/**
 * Build and configure the Fastify application
 */
export async function buildApp(
  options: FastifyServerOptions = {},
): Promise<FastifyInstance> {
  // Load configuration
  const config = loadConfig();

  // Create Fastify instance with logging
  const app = Fastify({
    logger: {
      level: config.env.LOG_LEVEL,
      transport: config.isDevelopment
        ? {
            target: "pino-pretty",
            options: {
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname",
              colorize: true,
            },
          }
        : undefined,
    },
    ...options,
  });

  // Decorate Fastify instance with config
  app.decorate("config", config);

  // Register error handler
  app.setErrorHandler(errorHandler);

  // Register plugins in order
  // 1. CORS - must be early
  await app.register(corsPlugin);

  // 2. Swagger documentation
  await app.register(swaggerPlugin);

  // 3. Database connections
  await app.register(mongodbPlugin);
  await app.register(redisPlugin);

  // 4. Register all routes
  await app.register(registerRoutes);

  // Ready hook - log when server is ready
  app.addHook("onReady", async () => {
    app.log.info("🚀 API Gateway is ready");
    app.log.info(`📊 Environment: ${config.env.NODE_ENV}`);
    app.log.info(`🔗 MongoDB: Connected`);
    app.log.info(`🔗 Redis: Connected`);
  });

  // Close hook - cleanup on shutdown
  app.addHook("onClose", async () => {
    app.log.info("👋 Shutting down API Gateway...");
  });

  return app;
}

// Type augmentation for Fastify
declare module "fastify" {
  interface FastifyInstance {
    config: ApiConfig;
  }
}
