const { Router } = require("express");
const teacherController = require("../controllers/teacher.controller");

const router = Router();

router.get("/all", teacherController.getAllTeachers);
router.get("/", teacherController.getTeacher);
router.put("/", teacherController.updateTeacher);

module.exports = router;
