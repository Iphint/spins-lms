const { Router } = require("express");
const activityController = require("../controllers/activity.controller");

const router = Router();

router.get("/", activityController.getActivities);
router.get("/recent", activityController.getRecentActivities);
router.get("/stats", activityController.getActivityStats);

module.exports = router;
