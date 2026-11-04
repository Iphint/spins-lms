const { Router } = require("express");
const meetingController = require("../controllers/meeting.controller");

const router = Router();

router.get("/", meetingController.getMeetings);
router.post("/", meetingController.createMeeting);
router.get("/:id", meetingController.getMeetingById);

module.exports = router;
