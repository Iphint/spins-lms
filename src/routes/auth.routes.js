const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");

const router = Router();

router.post("/login", authController.login);
router.get("/me", requireAuth, authController.getMe);
router.get("/users", requireAuth, requireAdmin, authController.getUsers);
router.post("/users", requireAuth, requireAdmin, authController.createUser);
router.put("/users/:id", requireAuth, requireAdmin, authController.updateUser);
router.delete("/users/:id", requireAuth, requireAdmin, authController.deleteUser);

module.exports = router;
