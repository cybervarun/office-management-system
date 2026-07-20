const express = require("express");
const { body, query } = require("express-validator");
const controller = require("../controllers/userController");
const auth = require("../middlewares/auth");
const allowRoles = require("../middlewares/rbac");
const validate = require("../middlewares/validate");
const { ROLES } = require("../models/constants");

const router = express.Router();

router.use(auth);

router.get("/", allowRoles("Admin"), controller.listUsers);

router.post(
  "/",
  allowRoles("Admin"),
  [
    body("name").notEmpty(),
    body("email").isEmail({ require_tld: false }),
    body("phone").optional().isString(),
    body("role").isIn(ROLES),
    body("password").isLength({ min: 8 })
  ],
  validate,
  controller.createUser
);

router.patch(
  "/:id/role",
  allowRoles("Admin"),
  [body("role").isIn(ROLES)],
  validate,
  controller.editRole
);

router.patch(
  "/:id/password",
  allowRoles("Admin"),
  [body("password").isLength({ min: 8 })],
  validate,
  controller.updatePassword
);

router.patch("/:id/activate", allowRoles("Admin"), controller.activate);
router.patch("/:id/deactivate", allowRoles("Admin"), controller.deactivate);

router.get(
  "/search",
  allowRoles("Admin", "Help Desk", "IT Team", "Network Team", "Cybersecurity"),
  [query("q").optional().isString()],
  validate,
  controller.search
);

module.exports = router;
