const { Router } = require("express");
const studentController = require("../controllers/student.controller");
const router = Router();

router.get("/", studentController.getStudents);
router.post("/bulk", studentController.bulkCreateStudents);
router.post("/promote", studentController.promoteStudents);
router.post("/import-to-class", studentController.importStudentsToClass);
router.get("/promotion-candidates/:classId", studentController.getPromotionCandidates);
router.get("/:id/history", studentController.getStudentAcademicHistory);
router.get("/:id", studentController.getStudentById);
router.post("/", studentController.createStudent);
router.put("/:id", studentController.updateStudent);
router.delete("/:id", studentController.deleteStudent);

module.exports = router;
