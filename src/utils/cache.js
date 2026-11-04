/**
 * Unified Cache Utility (Redis + In-Memory Fallback)
 */

const { client, isConnected, memoryStore } = require("../config/redis");
const logger = require("../config/logger");

async function get(key) {
  try {
    if (isConnected && client) {
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    }
  } catch (err) {
    logger.debug(`[Cache] Redis get error for ${key}: ${err.message}`);
  }

  // Memory fallback
  const item = memoryStore.get(key);
  if (!item) return null;
  if (item.expireAt && item.expireAt <= Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  try {
    return JSON.parse(item.value);
  } catch {
    return item.value;
  }
}

async function set(key, value, ttlSeconds = 300) {
  const json = JSON.stringify(value);
  const ttl = Math.max(1, parseInt(ttlSeconds, 10) || 300);

  try {
    if (isConnected && client) {
      await client.set(key, json, "EX", ttl);
    }
  } catch (err) {
    logger.debug(`[Cache] Redis set error for ${key}: ${err.message}`);
  }

  // Store in memory fallback as well
  memoryStore.set(key, {
    value: json,
    expireAt: Date.now() + ttl * 1000,
  });

  return true;
}

async function del(key) {
  try {
    if (isConnected && client) {
      await client.del(key);
    }
  } catch (err) {
    logger.debug(`[Cache] Redis del error for ${key}: ${err.message}`);
  }
  memoryStore.delete(key);
  return true;
}

async function delPattern(pattern) {
  try {
    if (isConnected && client) {
      const keys = await client.keys(pattern);
      if (keys && keys.length > 0) {
        await client.del(...keys);
      }
    }
  } catch (err) {
    logger.debug(`[Cache] Redis delPattern error for ${pattern}: ${err.message}`);
  }

  // Clear matching in memory
  try {
    const regex = new RegExp("^" + pattern.split("*").map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
    for (const key of memoryStore.keys()) {
      if (regex.test(key)) {
        memoryStore.delete(key);
      }
    }
  } catch {
    // ignore regex errors
  }

  return true;
}

async function remember(key, ttlSeconds, fetcher) {
  const cached = await get(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const fresh = await fetcher();
  if (fresh !== null && fresh !== undefined) {
    await set(key, fresh, ttlSeconds);
  }
  return fresh;
}

async function flush() {
  try {
    if (isConnected && client) {
      await client.flushdb();
    }
  } catch (err) {
    logger.debug(`[Cache] Redis flush error: ${err.message}`);
  }
  memoryStore.clear();
  return true;
}

function getStatus() {
  return {
    redisConnected: isConnected,
    driver: isConnected ? "redis" : "memory-fallback",
    memoryCacheEntries: memoryStore.size,
  };
}

async function invalidatePrefix(prefix) {
  return delPattern(`${prefix}*`);
}

async function delPatterns(patterns = []) {
  if (!Array.isArray(patterns) || patterns.length === 0) return true;
  await Promise.all(patterns.map(p => delPattern(p)));
  return true;
}

async function reCache(key, value, ttlSeconds = 300) {
  await del(key);
  if (value !== null && value !== undefined) {
    await set(key, value, ttlSeconds);
  }
  return value;
}

module.exports = {
  get,
  set,
  del,
  delPattern,
  delPatterns,
  invalidatePrefix,
  remember,
  reCache,
  flush,
  getStatus,
};
