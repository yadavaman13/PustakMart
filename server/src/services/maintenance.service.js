import redis from "../config/cache.js";

const MAINTENANCE_KEY = "pustakmart:maintenance";
const MAINTENANCE_HISTORY_KEY = "pustakmart:maintenance:history";

/**
 * Gets the current maintenance status from Redis.
 * Defaults to disabled if no key exists or if parsing fails.
 */
export async function getMaintenanceStatus() {
  try {
    if (!redis) {
      console.warn("Redis client not available in getMaintenanceStatus, returning default.");
      return {
        enabled: false,
        message: "PustakMart is currently undergoing maintenance. We'll be back shortly.",
        startedAt: null
      };
    }
    const raw = await redis.get(MAINTENANCE_KEY);
    if (!raw) {
      return {
        enabled: false,
        message: "PustakMart is currently undergoing maintenance. We'll be back shortly.",
        startedAt: null
      };
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse maintenance status from Redis:", error);
    return {
      enabled: false,
      message: "PustakMart is currently undergoing maintenance. We'll be back shortly.",
      startedAt: null
    };
  }
}

/**
 * Sets the maintenance status in Redis, and appends to history when disabled.
 * @param {boolean} enabled - Whether maintenance mode is enabled
 * @param {string} message - Custom message to display to users
 */
export async function setMaintenanceStatus(enabled, message) {
  if (!redis) {
    throw new Error("Redis client is not initialized.");
  }

  const current = await getMaintenanceStatus();
  const now = new Date().toISOString();

  const nextStatus = {
    enabled,
    message: message || current.message || "PustakMart is currently undergoing maintenance. We'll be back shortly.",
    startedAt: enabled ? (current.startedAt || now) : null
  };

  // Log to history when turning maintenance mode OFF
  if (!enabled && current.enabled) {
    const logEntry = {
      message: current.message,
      startedAt: current.startedAt || now,
      endedAt: now
    };

    try {
      const rawHistory = await redis.get(MAINTENANCE_HISTORY_KEY);
      const history = rawHistory ? JSON.parse(rawHistory) : [];
      history.unshift(logEntry); // Prepend new log

      // Keep only last 50 logs
      if (history.length > 50) {
        history.length = 50;
      }
      await redis.set(MAINTENANCE_HISTORY_KEY, JSON.stringify(history));
    } catch (historyErr) {
      console.error("Failed to write maintenance history to Redis:", historyErr);
    }
  }

  await redis.set(MAINTENANCE_KEY, JSON.stringify(nextStatus));
  return nextStatus;
}

/**
 * Retrieves the historical log list of previous maintenance operations.
 */
export async function getMaintenanceHistory() {
  try {
    if (!redis) return [];
    const rawHistory = await redis.get(MAINTENANCE_HISTORY_KEY);
    return rawHistory ? JSON.parse(rawHistory) : [];
  } catch (error) {
    console.error("Failed to get maintenance history from Redis:", error);
    return [];
  }
}
