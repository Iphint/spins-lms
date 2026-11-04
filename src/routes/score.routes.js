const { Router } = require("express");
const scoreController = require("../controllers/score.controller");

const router = Router();

router.get("/", scoreController.getScores);
router.post("/bulk", scoreController.bulkSaveScores);
router.get("/:id", scoreController.getScoreById);
router.post("/", scoreController.createScore);
router.put("/:id", scoreController.updateScore);
router.delete("/:id", scoreController.deleteScore);

module.exports = router;
