/**
 * Academic Year Controller
 */

const academicYearService = require("../services/academicYear.service");
const { successResponse } = require("../utils/response");

async function getAcademicYears(req, res, next) {
  try {
    const data = await academicYearService.listAcademicYears();
    return successResponse(res, data, "Academic years retrieved");
  } catch (error) {
    next(error);
  }
}

async function getActiveAcademicYear(req, res, next) {
  try {
    const data = await academicYearService.getActiveAcademicYear();
    return successResponse(res, data, "Active academic year retrieved");
  } catch (error) {
    next(error);
  }
}

async function getAcademicYearById(req, res, next) {
  try {
    const data = await academicYearService.getAcademicYearById(req.params.id);
    return successResponse(res, data, "Academic year retrieved");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAcademicYears,
  getActiveAcademicYear,
  getAcademicYearById,
};
