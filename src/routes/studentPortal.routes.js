/**
 * Student Portal Routes
 */

const { Router } = require("express");
const controller = require("../controllers/studentPortal.controller");

const router = Router();

router.get("/dashboard", controller.getDashboard);
router.get("/classes", controller.getClasses);
router.get("/classes/:id", controller.getClassById);
router.get("/subjects", controller.getSubjects);
router.get("/materials", controller.getMaterials);
router.get("/materials/:id", controller.getMaterialById);
router.get("/worksheets", controller.getWorksheets);
router.post("/worksheets/:id/submit", controller.submitWorksheet);
router.get("/schedule", controller.getSchedule);
router.get("/calendar", controller.getCalendar);
router.get("/attendance", controller.getAttendance);
router.post("/attendance/check-in", controller.checkInAttendance);
router.get("/scores", controller.getScores);
router.get("/profile", controller.getProfile);
router.get("/projects", controller.getProjects);
router.get("/projects/:materialId", controller.getProjectByMaterial);
router.post("/projects", controller.saveProject);
router.post("/run-code", controller.runCode);

module.exports = router;
