/**
 * Teacher Controller
 */

const teacherService = require("../services/teacher.service");
const { successResponse } = require("../utils/response");

async function getTeacher(req, res, next) {
  try {
    const teacherId = req.user?.teacherId;
    const teacher = await teacherService.getTeacher(teacherId);
    return successResponse(res, teacher, "Teacher data retrieved");
  } catch (error) {
    next(error);
  }
}

async function updateTeacher(req, res, next) {
  try {
    const teacherId = req.user?.teacherId;
    const updated = await teacherService.updateTeacher(teacherId, req.body);
    return successResponse(res, updated, "Teacher updated");
  } catch (error) {
    next(error);
  }
}

async function getAllTeachers(req, res, next) {
  try {
    const data = await teacherService.getAllTeachers();
    return successResponse(res, data, "All teachers retrieved");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTeacher,
  updateTeacher,
  getAllTeachers,
};
