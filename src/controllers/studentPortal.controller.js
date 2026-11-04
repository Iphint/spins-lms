/**
 * Student Portal Controller
 */

const studentPortalService = require("../services/studentPortal.service");
const { successResponse } = require("../utils/response");

function getEffectiveStudentId(req) {
  // If user is a student, take their studentId
  if (req.user && req.user.studentId) {
    return req.user.studentId;
  }
  // If admin/teacher is viewing or testing with query param or header
  if (req.query.studentId) {
    return req.query.studentId;
  }
  if (req.headers && req.headers["x-student-id"]) {
    return req.headers["x-student-id"];
  }
  return null;
}

async function getDashboard(req, res, next) {
  try {
    const studentId = getEffectiveStudentId(req);
    const data = await studentPortalService.getDashboard(studentId);
    return successResponse(res, data, "Student dashboard retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function getMaterials(req, res, next) {
  try {
    const studentId = getEffectiveStudentId(req);
    const data = await studentPortalService.getMaterials(studentId, req.query);
    return successResponse(res, data, "Materials retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function getWorksheets(req, res, next) {
  try {
    const studentId = getEffectiveStudentId(req);
    const data = await studentPortalService.getWorksheets(studentId, req.query);
    return successResponse(res, data, "Worksheets retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function submitWorksheet(req, res, next) {
  try {
    const studentId = getEffectiveStudentId(req);
    const data = await studentPortalService.submitWorksheet(studentId, req.params.id, req.body);
    return successResponse(res, data, "Worksheet submitted successfully", 201);
  } catch (error) {
    next(error);
  }
}

async function getSchedule(req, res, next) {
  try {
    const studentId = getEffectiveStudentId(req);
    const data = await studentPortalService.getSchedule(studentId);
    return successResponse(res, data, "Schedule retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function getCalendar(req, res, next) {
  try {
    const studentId = getEffectiveStudentId(req);
    const data = await studentPortalService.getCalendar(studentId, req.query);
    return successResponse(res, data, "Calendar data retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function getAttendance(req, res, next) {
  try {
    const studentId = getEffectiveStudentId(req);
    const data = await studentPortalService.getAttendance(studentId);
    return successResponse(res, data, "Attendance retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function checkInAttendance(req, res, next) {
  try {
    const studentId = getEffectiveStudentId(req);
    const { meetingId, pin } = req.body;
    const data = await studentPortalService.checkInAttendance(studentId, meetingId, pin);
    return successResponse(res, data, "Presensi berhasil dicatat", 200);
  } catch (error) {
    next(error);
  }
}

async function getScores(req, res, next) {
  try {
    const studentId = getEffectiveStudentId(req);
    const data = await studentPortalService.getScores(studentId);
    return successResponse(res, data, "Scores retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const studentId = getEffectiveStudentId(req);
    const data = await studentPortalService.getProfile(studentId);
    return successResponse(res, data, "Profile retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function getClasses(req, res, next) {
  try {
    const studentId = getEffectiveStudentId(req);
    const data = await studentPortalService.getClasses(studentId);
    return successResponse(res, data, "Enrolled classes retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function getClassById(req, res, next) {
  try {
    const studentId = getEffectiveStudentId(req);
    const data = await studentPortalService.getClassById(studentId, req.params.id);
    return successResponse(res, data, "Class detail retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function getSubjects(req, res, next) {
  try {
    const studentId = getEffectiveStudentId(req);
    const data = await studentPortalService.getSubjects(studentId);
    return successResponse(res, data, "Assigned subjects retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function getMaterialById(req, res, next) {
  try {
    const studentId = getEffectiveStudentId(req);
    const data = await studentPortalService.getMaterialById(studentId, req.params.id);
    return successResponse(res, data, "Material detail retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function getProjects(req, res, next) {
  try {
    const studentId = getEffectiveStudentId(req);
    const data = await studentPortalService.getProjects(studentId);
    return successResponse(res, data, "Saved projects retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function getProjectByMaterial(req, res, next) {
  try {
    const studentId = getEffectiveStudentId(req);
    const data = await studentPortalService.getProjectByMaterial(studentId, req.params.materialId);
    return successResponse(res, data, "Material project retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function saveProject(req, res, next) {
  try {
    const studentId = getEffectiveStudentId(req);
    const data = await studentPortalService.saveProject(studentId, req.body);
    return successResponse(res, data, "Project saved successfully", 201);
  } catch (error) {
    next(error);
  }
}

async function runCode(req, res, next) {
  try {
    const result = await studentPortalService.runCode(req.body);
    return successResponse(res, result, "Code executed", 200);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard,
  getMaterials,
  getMaterialById,
  getWorksheets,
  submitWorksheet,
  getSchedule,
  getCalendar,
  getAttendance,
  checkInAttendance,
  getScores,
  getProfile,
  getClasses,
  getClassById,
  getSubjects,
  getProjects,
  getProjectByMaterial,
  saveProject,
  runCode,
};
