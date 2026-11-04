const { Router } = require("express");
const analyticsController = require("../controllers/analytics.controller");

const router = Router();

router.get("/attendance-trend", analyticsController.getAttendanceTrend);
router.get("/worksheet-trend", analyticsController.getWorksheetTrend);
router.get("/average-score-trend", analyticsController.getAverageScoreTrend);
router.get("/class-comparison", analyticsController.getClassComparison);
router.get("/semester-progress", analyticsController.getSemesterProgress);
router.get("/learning-targets", analyticsController.getLearningTargets);

module.exports = router;
