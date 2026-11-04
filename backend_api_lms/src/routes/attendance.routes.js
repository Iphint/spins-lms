const { Router } = require("express");
const attendanceController = require("../controllers/attendance.controller");

const router = Router();

router.get("/", attendanceController.getAttendance);
router.get("/matrix/:classId", attendanceController.getAttendanceMatrix);
router.get("/summary/:meetingId", attendanceController.getAttendanceSummary);
router.post("/mark-all-present", attendanceController.markAllPresent);
router.post("/pin/:meetingId", attendanceController.generateCheckInPin);
router.post("/bulk", attendanceController.bulkUpsertAttendance);
router.post("/", attendanceController.upsertAttendance);
router.post("/reset/:classId", attendanceController.resetAttendance);
router.put("/:id", attendanceController.updateAttendance);
router.delete("/:id", attendanceController.deleteAttendance);
router.get("/:id", attendanceController.getAttendanceById);

module.exports = router;
