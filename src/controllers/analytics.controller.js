/**
 * Analytics Controller
 */

const analyticsService = require("../services/analytics.service");
const { successResponse } = require("../utils/response");

async function getAttendanceTrend(req, res, next) {
  try {
    const data = await analyticsService.getAttendanceTrend();
    return successResponse(res, data, "Attendance trend retrieved");
  } catch (error) {
    next(error);
  }
}

async function getWorksheetTrend(req, res, next) {
  try {
    const data = await analyticsService.getWorksheetTrend();
    return successResponse(res, data, "Worksheet trend retrieved");
  } catch (error) {
    next(error);
  }
}

async function getAverageScoreTrend(req, res, next) {
  try {
    const data = await analyticsService.getAverageScoreTrend();
    return successResponse(res, data, "Average score trend retrieved");
  } catch (error) {
    next(error);
  }
}

async function getClassComparison(req, res, next) {
  try {
    const data = await analyticsService.getClassComparison();
    return successResponse(res, data, "Class comparison retrieved");
  } catch (error) {
    next(error);
  }
}

async function getSemesterProgress(req, res, next) {
  try {
    const data = await analyticsService.getSemesterProgress();
    return successResponse(res, data, "Semester progress retrieved");
  } catch (error) {
    next(error);
  }
}

async function getLearningTargets(req, res, next) {
  try {
    const data = await analyticsService.getLearningTargets();
    return successResponse(res, data, "Learning targets retrieved");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAttendanceTrend,
  getWorksheetTrend,
  getAverageScoreTrend,
  getClassComparison,
  getSemesterProgress,
  getLearningTargets,
};
