/**
 * Activity Controller
 */

const activityService = require("../services/activity.service");
const { successResponse } = require("../utils/response");

async function getActivities(req, res, next) {
  try {
    const data = await activityService.listActivities(req.query);
    return successResponse(res, data, "Activities retrieved");
  } catch (error) {
    next(error);
  }
}

async function getRecentActivities(req, res, next) {
  try {
    const limit = req.query.limit || 10;
    const data = await activityService.listRecentActivities(parseInt(limit, 10));
    return successResponse(res, data, "Recent activities retrieved");
  } catch (error) {
    next(error);
  }
}

async function getActivityStats(req, res, next) {
  try {
    const data = await activityService.getActivityStats();
    return successResponse(res, data, "Activity statistics retrieved");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getActivities,
  getRecentActivities,
  getActivityStats,
};
