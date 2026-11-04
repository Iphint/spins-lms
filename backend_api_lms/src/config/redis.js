const Redis = require("ioredis");
const logger = require("./logger");

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const REDIS_ENABLED = process.env.REDIS_ENABLED !== "false";

let redisClient = null;
let isConnected = false;

// Fallback in-memory store: Map<key, { value: string, expireAt: number | null }>
const memoryStore = new Map();

function cleanMemoryStore() {
  const now = Date.now();
  for (const [key, item] of memoryStore.entries()) {
    if (item.expireAt && item.expireAt <= now) {
      memoryStore.delete(key);
    }
  }
}
setInterval(cleanMemoryStore, 60 * 1000).unref();

if (REDIS_ENABLED) {
  try {
    redisClient = new Redis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        if (times > 3) {
          return null; // Stop reconnecting after 3 attempts
        }
        return Math.min(times * 200, 1000);
      },
    });

    redisClient.on("connect", () => {
      isConnected = true;
      logger.info("[Redis] Connected to Redis server successfully.");
    });

    redisClient.on("ready", () => {
      isConnected = true;
    });

    redisClient.on("error", (err) => {
      isConnected = false;
      // Suppress unhandled error crashes
      if (process.env.NODE_ENV !== "test") {
        logger.warn(`[Redis] Connection warning: ${err.message}. Falling back to in-memory cache.`);
      }
    });

    redisClient.on("close", () => {
      isConnected = false;
    });

    // Attempt non-blocking initial connection
    redisClient.connect().catch(() => {
      isConnected = false;
    });
  } catch (err) {
    isConnected = false;
    logger.warn(`[Redis] Failed to initialize Redis client: ${err.message}. Using in-memory fallback.`);
  }
}

async function disconnect() {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    }
  }
}

module.exports = {
  get client() {
    return redisClient;
  },
  get isConnected() {
    return isConnected && redisClient?.status === "ready";
  },
  memoryStore,
  REDIS_ENABLED,
  disconnect,
};
