const { Router } = require("express");
const worksheetController = require("../controllers/worksheet.controller");
const upload = require("../middlewares/upload.middleware");

const router = Router();

router.get("/", worksheetController.getWorksheets);
router.post("/upload", upload.single("file"), worksheetController.uploadWorksheetFile);
router.post("/", worksheetController.createWorksheet);
router.put("/:id", worksheetController.updateWorksheet);
router.delete("/:id", worksheetController.deleteWorksheet);
router.get("/:id", worksheetController.getWorksheetById);

module.exports = router;
