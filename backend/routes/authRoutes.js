const express = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/authController");
const validate = require("../middlewares/validate");

const router = express.Router();

router.post(
  "/login",
  [
    body("email").isEmail({ require_tld: false }).withMessage("Valid email is required"),
    body("password").isLength({ min: 8 }).withMessage("Password is required")
  ],
  validate,
  controller.login
);

module.exports = router;
