/**
 * Calendar Event Controller
 */

const calendarEventService = require("../services/calendarEvent.service");
const { successResponse } = require("../utils/response");

async function getCalendarEvents(req, res, next) {
  try {
    const data = await calendarEventService.listCalendarEvents(req.query);
    return successResponse(res, data, "Calendar events retrieved");
  } catch (error) {
    next(error);
  }
}

async function getCalendarEventById(req, res, next) {
  try {
    const data = await calendarEventService.getCalendarEventById(req.params.id);
    return successResponse(res, data, "Calendar event retrieved");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCalendarEvents,
  getCalendarEventById,
};
