/**
 * MongoDB Connection Plugin
 * Fastify plugin for MongoDB/Mongoose connection management
 */

import fp from "fastify-plugin";
import mongoose from "mongoose";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";

/**
 * MongoDB connection plugin
 * Establishes and manages MongoDB connection using Mongoose
 */
const mongodbPluginAsync: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  const { config } = fastify;
  const { mongodbUri, mongodb } = config;

  try {
    // Configure Mongoose
    mongoose.set("strictQuery", true);

    // Connect to MongoDB
    await mongoose.connect(mongodbUri, {
      maxPoolSize: mongodb.options.maxPoolSize,
      minPoolSize: mongodb.options.minPoolSize,
      serverSelectionTimeoutMS: mongodb.options.serverSelectionTimeoutMS,
      socketTimeoutMS: mongodb.options.socketTimeoutMS,
      family: mongodb.options.family,
    });

    fastify.log.info(`✅ MongoDB connected to database: ${mongodb.database}`);

    // Decorate fastify with mongoose instance
    fastify.decorate("mongoose", mongoose);
    fastify.decorate("db", mongoose.connection);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      fastify.log.error({ err }, "❌ MongoDB connection error");
    });

    mongoose.connection.on("disconnected", () => {
      fastify.log.warn("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      fastify.log.info("🔄 MongoDB reconnected");
    });

    // Cleanup on close
    fastify.addHook("onClose", async () => {
      await mongoose.connection.close();
      fastify.log.info("MongoDB connection closed");
    });
  } catch (err) {
    fastify.log.error({ err }, "❌ Failed to connect to MongoDB");
    throw err;
  }
};

/**
 * Health check for MongoDB connection
 */
export async function checkMongoDBHealth(): Promise<{
  status: "healthy" | "unhealthy";
  latency?: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    if (mongoose.connection.readyState !== 1) {
      return { status: "unhealthy", error: "Not connected" };
    }

    // Ping the database
    await mongoose.connection.db?.admin().ping();
    const latency = Date.now() - start;

    return { status: "healthy", latency };
  } catch (err) {
    return {
      status: "unhealthy",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// Export as Fastify plugin with proper encapsulation
export const mongodbPlugin = fp(mongodbPluginAsync, {
  name: "mongodb",
  fastify: "4.x",
});

// Type augmentation
declare module "fastify" {
  interface FastifyInstance {
    mongoose: typeof mongoose;
    db: mongoose.Connection;
  }
}
