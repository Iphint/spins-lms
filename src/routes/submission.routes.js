const { Router } = require("express");
const submissionController = require("../controllers/submission.controller");

const router = Router();

router.get("/", submissionController.getSubmissions);
router.post("/", submissionController.createSubmission);
router.put("/:id", submissionController.updateSubmission);
router.get("/:id", submissionController.getSubmissionById);

module.exports = router;
