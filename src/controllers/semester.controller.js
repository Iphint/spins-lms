/**
 * Semester Controller
 */

const semesterService = require("../services/semester.service");
const { successResponse } = require("../utils/response");

async function getSemesters(req, res, next) {
  try {
    const data = await semesterService.listSemesters(req.query);
    return successResponse(res, data, "Semesters retrieved");
  } catch (error) {
    next(error);
  }
}

async function getActiveSemester(req, res, next) {
  try {
    const data = await semesterService.getActiveSemester();
    return successResponse(res, data, "Active semester retrieved");
  } catch (error) {
    next(error);
  }
}

async function getSemesterById(req, res, next) {
  try {
    const data = await semesterService.getSemesterById(req.params.id);
    return successResponse(res, data, "Semester retrieved");
  } catch (error) {
    next(error);
  }
}

async function createSemester(req, res, next) {
  try {
    const data = await semesterService.createSemester(req.body, req.user);
    return successResponse(res, data, "Semester created", 201);
  } catch (error) {
    next(error);
  }
}

async function updateSemester(req, res, next) {
  try {
    const data = await semesterService.updateSemester(req.params.id, req.body, req.user);
    return successResponse(res, data, "Semester updated");
  } catch (error) {
    next(error);
  }
}

async function deleteSemester(req, res, next) {
  try {
    const data = await semesterService.deleteSemester(req.params.id, req.user);
    return successResponse(res, data, "Semester deleted");
  } catch (error) {
    next(error);
  }
}

async function setActiveSemester(req, res, next) {
  try {
    const data = await semesterService.setActiveSemester(req.params.id);
    return successResponse(res, data, "Active semester updated");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSemesters,
  getActiveSemester,
  getSemesterById,
  createSemester,
  updateSemester,
  deleteSemester,
  setActiveSemester,
};
