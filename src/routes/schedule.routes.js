const { Router } = require("express");
const scheduleController = require("../controllers/schedule.controller");
const router = Router();

router.get("/", scheduleController.getScheduleSlots);
router.post("/weekly", scheduleController.setWeeklySchedule);
router.post("/bulk", scheduleController.bulkSaveSchedules);
router.post("/distribute", scheduleController.distributeMaterials);
router.get("/:id", scheduleController.getScheduleSlotById);
router.post("/", scheduleController.createScheduleSlot);
router.put("/:id", scheduleController.updateScheduleSlot);
router.delete("/:id", scheduleController.deleteScheduleSlot);

module.exports = router;
