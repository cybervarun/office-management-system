const express = require("express");
const router = express.Router();
const controller = require("../controllers/reportsController");
const auth = require("../middlewares/auth");
const allowRoles = require("../middlewares/rbac");

router.get("/", auth, allowRoles("Admin", "Help Desk", "IT Team"), controller.getReports);

module.exports = router;
