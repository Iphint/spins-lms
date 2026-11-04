const { Router } = require("express");
const calendarEventController = require("../controllers/calendarEvent.controller");

const router = Router();

router.get("/", calendarEventController.getCalendarEvents);
router.get("/:id", calendarEventController.getCalendarEventById);

module.exports = router;
