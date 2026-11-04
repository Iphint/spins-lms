/**
 * Cache Controller
 */

const cache = require("../utils/cache");
const { successResponse } = require("../utils/response");

async function getStatus(req, res, next) {
  try {
    const status = cache.getStatus();
    return successResponse(res, status, "Cache status retrieved");
  } catch (error) {
    next(error);
  }
}

async function flush(req, res, next) {
  try {
    await cache.flush();
    return successResponse(res, { flushed: true }, "Cache successfully flushed");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStatus,
  flush,
};
