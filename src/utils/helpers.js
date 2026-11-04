/**
 * Shared Helper Functions
 */

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

function safeJsonParse(value, fallback = []) {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function safeJsonStringify(value, fallback = "[]") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

module.exports = {
  sanitizeUser,
  safeJsonParse,
  safeJsonStringify,
  getTodayString,
};
