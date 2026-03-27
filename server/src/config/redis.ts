import Redis from "ioredis";
import { config } from "./index";

let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (process.env.NODE_ENV === "test") return null;
  if (!config.redis.url) return null;
  if (!client) {
    client = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
    });
    client.on("error", (err) => {
      console.warn("Redis:", err.message);
    });
  }
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    try {
      await client.quit();
    } finally {
      client = null;
    }
  }
}
