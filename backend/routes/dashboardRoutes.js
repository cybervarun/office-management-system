const express = require("express");
const router = express.Router();
const controller = require("../controllers/dashboardController");
const auth = require("../middlewares/auth");
const allowRoles = require("../middlewares/rbac");

router.get("/", auth, allowRoles("Admin", "Help Desk", "IT Team"), controller.getStats);

module.exports = router;
