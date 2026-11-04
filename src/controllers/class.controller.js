/**
 * Class Controller
 */

const classService = require("../services/class.service");
const { successResponse } = require("../utils/response");

async function getClasses(req, res, next) {
  try {
    const data = await classService.listClasses(req.query, req.user);
    return successResponse(res, data, "Classes retrieved");
  } catch (error) {
    next(error);
  }
}

async function getClassById(req, res, next) {
  try {
    const data = await classService.getClassById(req.params.id);
    return successResponse(res, data, "Class retrieved");
  } catch (error) {
    next(error);
  }
}

async function createClass(req, res, next) {
  try {
    const data = await classService.createClass(req.body, req.user);
    return successResponse(res, data, "Class created", 201);
  } catch (error) {
    next(error);
  }
}

async function updateClass(req, res, next) {
  try {
    const data = await classService.updateClass(req.params.id, req.body, req.user);
    return successResponse(res, data, "Class updated");
  } catch (error) {
    next(error);
  }
}

async function deleteClass(req, res, next) {
  try {
    await classService.deleteClass(req.params.id);
    return successResponse(res, null, "Class deleted");
  } catch (error) {
    next(error);
  }
}

async function resetClassRoster(req, res, next) {
  try {
    const result = await classService.resetClassRoster(req.params.id, req.body);
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  resetClassRoster,
};
