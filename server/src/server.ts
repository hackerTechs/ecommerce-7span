import { createServer } from "http";
import app from "./app";
import { config } from "./config";
import prisma from "./config/database";
import { getRedis, closeRedis } from "./config/redis";
import { initSocket } from "./config/socket";

async function main() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    if (config.redis.url) {
      try {
        await getRedis()?.ping();
        console.log("Redis connected (catalog cache enabled)");
      } catch {
        console.warn("Redis unreachable — catalog requests will hit the database until Redis is available");
      }
    }

    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(config.port, () => {
      console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });

    const shutdown = async () => {
      await closeRedis();
      await prisma.$disconnect();
      process.exit(0);
    };
    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
  } catch (error) {
    console.error("Failed to start server:", error);
    await closeRedis();
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
