const { Router } = require("express");
const semesterController = require("../controllers/semester.controller");

const router = Router();

router.get("/", semesterController.getSemesters);
router.get("/active", semesterController.getActiveSemester);
router.get("/:id", semesterController.getSemesterById);
router.post("/", semesterController.createSemester);
router.put("/:id", semesterController.updateSemester);
router.delete("/:id", semesterController.deleteSemester);
router.put("/:id/activate", semesterController.setActiveSemester);
router.post("/:id/activate", semesterController.setActiveSemester);

module.exports = router;
