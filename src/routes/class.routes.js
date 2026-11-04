const { Router } = require("express");
const classController = require("../controllers/class.controller");

const router = Router();

router.get("/", classController.getClasses);
router.get("/:id", classController.getClassById);
router.post("/:id/reset-roster", classController.resetClassRoster);
router.post("/", classController.createClass);
router.put("/:id", classController.updateClass);
router.delete("/:id", classController.deleteClass);

module.exports = router;
