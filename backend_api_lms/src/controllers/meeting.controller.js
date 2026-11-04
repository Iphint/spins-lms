/**
 * Meeting Controller
 */

const meetingService = require("../services/meeting.service");
const { successResponse } = require("../utils/response");

async function getMeetings(req, res, next) {
  try {
    const data = await meetingService.listMeetings(req.query, req.user);
    return successResponse(res, data, "Meetings retrieved");
  } catch (error) {
    next(error);
  }
}

async function getMeetingById(req, res, next) {
  try {
    const data = await meetingService.getMeetingById(req.params.id);
    return successResponse(res, data, "Meeting retrieved");
  } catch (error) {
    next(error);
  }
}

async function createMeeting(req, res, next) {
  try {
    const data = await meetingService.createMeeting(req.body);
    return successResponse(res, data, "Meeting created");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMeetings,
  getMeetingById,
  createMeeting,
};
