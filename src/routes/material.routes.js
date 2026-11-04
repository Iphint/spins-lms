const { Router } = require("express");
const materialController = require("../controllers/material.controller");
const upload = require("../middlewares/upload.middleware");

const router = Router();

router.get("/", materialController.getMaterials);
router.post("/upload", upload.single("file"), materialController.uploadMaterialFile);
router.post("/deploy", materialController.deployMaterialToClasses);
router.post("/clone-curriculum", materialController.cloneCurriculum);
router.post("/template-curriculum", materialController.applyTemplateCurriculum);
router.post("/bulk", materialController.bulkCreateMaterials);
router.get("/curriculum-templates", materialController.getCurriculumTemplates);
router.get("/:id", materialController.getMaterialById);
router.post("/", materialController.createMaterial);
router.put("/:id", materialController.updateMaterial);
router.delete("/:id", materialController.deleteMaterial);

module.exports = router;
