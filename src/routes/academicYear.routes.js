const { Router } = require("express");
const academicYearController = require("../controllers/academicYear.controller");

const router = Router();

router.get("/", academicYearController.getAcademicYears);
router.get("/active", academicYearController.getActiveAcademicYear);
router.get("/:id", academicYearController.getAcademicYearById);

module.exports = router;
