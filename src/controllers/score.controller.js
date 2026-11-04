/**
 * Score Controller
 */

const scoreService = require("../services/score.service");
const { successResponse } = require("../utils/response");

async function getScores(req, res, next) {
  try {
    const data = await scoreService.listScores(req.query);
    return successResponse(res, data, "Scores retrieved");
  } catch (error) {
    next(error);
  }
}

async function getScoreById(req, res, next) {
  try {
    const data = await scoreService.getScoreById(req.params.id);
    return successResponse(res, data, "Score retrieved");
  } catch (error) {
    next(error);
  }
}

async function createScore(req, res, next) {
  try {
    const data = await scoreService.createScore(req.body, req.user);
    return successResponse(res, data, "Score created successfully", 201);
  } catch (error) {
    next(error);
  }
}

async function bulkSaveScores(req, res, next) {
  try {
    const data = await scoreService.bulkSaveScores(req.body, req.user);
    return successResponse(res, data, "Bulk scores saved successfully");
  } catch (error) {
    next(error);
  }
}

async function updateScore(req, res, next) {
  try {
    const data = await scoreService.updateScore(req.params.id, req.body, req.user);
    return successResponse(res, data, "Score updated successfully");
  } catch (error) {
    next(error);
  }
}

async function deleteScore(req, res, next) {
  try {
    await scoreService.deleteScore(req.params.id, req.user);
    return successResponse(res, null, "Score deleted successfully");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getScores,
  getScoreById,
  createScore,
  updateScore,
  deleteScore,
  bulkSaveScores,
};
