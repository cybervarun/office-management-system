const express = require("express");
const router = express.Router();
const controller = require("../controllers/settingsController");
const auth = require("../middlewares/auth");
const allowRoles = require("../middlewares/rbac");

router.get("/", auth, allowRoles("Admin"), controller.getSettings);
router.patch("/notifications", auth, allowRoles("Admin"), controller.updateNotifications);

module.exports = router;
