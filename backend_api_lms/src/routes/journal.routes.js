const { Router } = require("express");
const journalController = require("../controllers/journal.controller");

const router = Router();

router.get("/", journalController.getJournals);
router.get("/:id", journalController.getJournalById);

module.exports = router;
