/**
 * Student Controller
 */

const studentService = require("../services/student.service");
const { successResponse } = require("../utils/response");

async function getStudents(req, res, next) {
  try {
    const data = await studentService.listStudents(req.query, req.user);
    return successResponse(res, data, "Students retrieved");
  } catch (error) {
    next(error);
  }
}

async function getStudentById(req, res, next) {
  try {
    const data = await studentService.getStudentById(req.params.id);
    return successResponse(res, data, "Student retrieved");
  } catch (error) {
    next(error);
  }
}

async function createStudent(req, res, next) {
  try {
    const data = await studentService.createStudent(req.body, req.user);
    return successResponse(res, data, "Student created", 201);
  } catch (error) {
    next(error);
  }
}

async function bulkCreateStudents(req, res, next) {
  try {
    const { classId, students } = req.body;
    const result = await studentService.bulkCreateStudents(classId, students, req.user);
    return successResponse(res, result, `${result.length} students created`);
  } catch (error) {
    next(error);
  }
}

async function updateStudent(req, res, next) {
  try {
    const data = await studentService.updateStudent(req.params.id, req.body, req.user);
    return successResponse(res, data, "Student updated");
  } catch (error) {
    next(error);
  }
}

async function deleteStudent(req, res, next) {
  try {
    await studentService.deleteStudent(req.params.id, req.user);
    return successResponse(res, null, "Student deleted");
  } catch (error) {
    next(error);
  }
}

async function promoteStudents(req, res, next) {
  try {
    const result = await studentService.promoteStudents(req.body, req.user);
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
}

async function importStudentsToClass(req, res, next) {
  try {
    const { classId, studentIds, notes } = req.body;
    const result = await studentService.importStudentsToClass(classId, studentIds, notes);
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
}

async function getStudentAcademicHistory(req, res, next) {
  try {
    const result = await studentService.getStudentAcademicHistory(req.params.id);
    return successResponse(res, result, "Academic history retrieved");
  } catch (error) {
    next(error);
  }
}

async function getPromotionCandidates(req, res, next) {
  try {
    const result = await studentService.getPromotionCandidates(req.params.classId || req.query.classId);
    return successResponse(res, result, "Promotion candidates retrieved");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  bulkCreateStudents,
  updateStudent,
  deleteStudent,
  promoteStudents,
  importStudentsToClass,
  getStudentAcademicHistory,
  getPromotionCandidates,
};
