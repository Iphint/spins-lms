const { Router } = require("express");
const cacheController = require("../controllers/cache.controller");

const router = Router();

router.get("/status", cacheController.getStatus);
router.post("/flush", cacheController.flush);

module.exports = router;
