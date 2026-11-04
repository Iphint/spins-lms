/**
 * Attendance Controller
 */

const attendanceService = require("../services/attendance.service");
const { successResponse } = require("../utils/response");

async function getAttendance(req, res, next) {
  try {
    const data = await attendanceService.listAttendance(req.query);
    return successResponse(res, data, "Attendance records retrieved");
  } catch (error) {
    next(error);
  }
}

async function getAttendanceSummary(req, res, next) {
  try {
    const data = await attendanceService.getAttendanceSummary(req.params.meetingId);
    return successResponse(res, data, "Attendance summary retrieved");
  } catch (error) {
    next(error);
  }
}

async function bulkUpsertAttendance(req, res, next) {
  try {
    const result = await attendanceService.bulkUpsertAttendance(req.body, req.user);
    return successResponse(res, result, "Attendance records saved");
  } catch (error) {
    next(error);
  }
}

async function markAllPresent(req, res, next) {
  try {
    const result = await attendanceService.markAllPresent(req.body, req.user);
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
}

async function getAttendanceMatrix(req, res, next) {
  try {
    const data = await attendanceService.getAttendanceMatrix(req.params.classId);
    return successResponse(res, data, "Attendance matrix retrieved");
  } catch (error) {
    next(error);
  }
}

async function generateCheckInPin(req, res, next) {
  try {
    const data = await attendanceService.generateCheckInPin(req.params.meetingId);
    return successResponse(res, data, "Check-in PIN generated successfully");
  } catch (error) {
    next(error);
  }
}

async function upsertAttendance(req, res, next) {
  try {
    const data = await attendanceService.upsertAttendance(req.body);
    return successResponse(res, data, "Attendance record saved");
  } catch (error) {
    next(error);
  }
}

async function resetAttendance(req, res, next) {
  try {
    const result = await attendanceService.resetAttendance(req.params.classId);
    return successResponse(res, { deletedCount: result.deletedCount, classId: result.classId }, `Attendance reset for ${result.className}`);
  } catch (error) {
    next(error);
  }
}

async function updateAttendance(req, res, next) {
  try {
    const data = await attendanceService.updateAttendance(req.params.id, req.body);
    return successResponse(res, data, "Attendance record updated");
  } catch (error) {
    next(error);
  }
}

async function deleteAttendance(req, res, next) {
  try {
    await attendanceService.deleteAttendance(req.params.id);
    return successResponse(res, null, "Attendance record deleted");
  } catch (error) {
    next(error);
  }
}

async function getAttendanceById(req, res, next) {
  try {
    const data = await attendanceService.getAttendanceById(req.params.id);
    return successResponse(res, data, "Attendance record retrieved");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAttendance,
  getAttendanceSummary,
  bulkUpsertAttendance,
  markAllPresent,
  getAttendanceMatrix,
  generateCheckInPin,
  upsertAttendance,
  resetAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceById,
};
