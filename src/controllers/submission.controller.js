/**
 * Submission Controller
 */

const submissionService = require("../services/submission.service");
const { successResponse } = require("../utils/response");

async function getSubmissions(req, res, next) {
  try {
    const data = await submissionService.listSubmissions(req.query);
    return successResponse(res, data, "Submissions retrieved");
  } catch (error) {
    next(error);
  }
}

async function getSubmissionById(req, res, next) {
  try {
    const data = await submissionService.getSubmissionById(req.params.id);
    return successResponse(res, data, "Submission retrieved");
  } catch (error) {
    next(error);
  }
}

async function createSubmission(req, res, next) {
  try {
    const data = await submissionService.createOrUpdateSubmission(req.body, req.user);
    return successResponse(res, data, "Submission saved", 201);
  } catch (error) {
    next(error);
  }
}

async function updateSubmission(req, res, next) {
  try {
    const data = await submissionService.updateSubmission(req.params.id, req.body, req.user);
    return successResponse(res, data, "Submission updated");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSubmissions,
  getSubmissionById,
  createSubmission,
  updateSubmission,
};
