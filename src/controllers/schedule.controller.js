/**
 * Schedule Controller
 */

const scheduleService = require("../services/schedule.service");
const { successResponse } = require("../utils/response");

async function getScheduleSlots(req, res, next) {
  try {
    const data = await scheduleService.listScheduleSlots(req.query, req.user);
    return successResponse(res, data, "Schedule slots retrieved");
  } catch (error) {
    next(error);
  }
}

async function setWeeklySchedule(req, res, next) {
  try {
    const { classId, lessons } = req.body;
    const data = await scheduleService.setWeeklySchedule(classId, lessons, req.user);
    return successResponse(res, data, "Weekly schedule set");
  } catch (error) {
    next(error);
  }
}

async function bulkSaveSchedules(req, res, next) {
  try {
    const data = await scheduleService.bulkSaveSchedules(req.body, req.user);
    return successResponse(res, data, "Bulk schedule saved");
  } catch (error) {
    next(error);
  }
}

async function distributeMaterials(req, res, next) {
  try {
    const { classId } = req.body;
    const result = await scheduleService.distributeMaterials(classId, req.user);
    return successResponse(res, { slots: result.slots, stats: result.stats }, result.message);
  } catch (error) {
    next(error);
  }
}

async function getScheduleSlotById(req, res, next) {
  try {
    const data = await scheduleService.getScheduleSlotById(req.params.id);
    return successResponse(res, data, "Schedule slot retrieved");
  } catch (error) {
    next(error);
  }
}

async function createScheduleSlot(req, res, next) {
  try {
    const data = await scheduleService.createScheduleSlot(req.body, req.user);
    return successResponse(res, data, "Schedule slot created");
  } catch (error) {
    next(error);
  }
}

async function updateScheduleSlot(req, res, next) {
  try {
    const data = await scheduleService.updateScheduleSlot(req.params.id, req.body, req.user);
    return successResponse(res, data, "Schedule slot updated");
  } catch (error) {
    next(error);
  }
}

async function deleteScheduleSlot(req, res, next) {
  try {
    await scheduleService.deleteScheduleSlot(req.params.id, req.user);
    return successResponse(res, null, "Schedule slot deleted");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getScheduleSlots,
  setWeeklySchedule,
  bulkSaveSchedules,
  distributeMaterials,
  getScheduleSlotById,
  createScheduleSlot,
  updateScheduleSlot,
  deleteScheduleSlot,
};
