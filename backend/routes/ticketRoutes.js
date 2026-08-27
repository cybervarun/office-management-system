const express = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/ticketController");
const auth = require("../middlewares/auth");
const allowRoles = require("../middlewares/rbac");
const validate = require("../middlewares/validate");
const { TEAMS } = require("../utils/constants");

const router = express.Router();

router.use(auth);

const teamEnum = TEAMS;
const statusEnum = ["Open", "In Progress", "Pending", "Resolved", "Closed"];

router.get("/", allowRoles("Admin", "Help Desk", "IT Team", "Network Team", "Cybersecurity"), controller.listTickets);
router.get("/:id", allowRoles("Admin", "Help Desk", "IT Team", "Network Team", "Cybersecurity"), controller.getTicket);

router.post(
  "/",
  allowRoles("Admin", "Help Desk"),
  [body("title").notEmpty(), body("description").notEmpty(), body("inventory_id").optional().isInt()],
  validate,
  controller.createTicket
);

router.patch(
  "/:id/assign",
  allowRoles("Admin", "Help Desk"),
  [body("toTeam").isIn(teamEnum), body("note").optional().isString()],
  validate,
  controller.assignTeam
);

router.patch(
  "/:id/status",
  allowRoles("Admin", "Help Desk", "IT Team", "Network Team", "Cybersecurity"),
  [body("status").isIn(statusEnum)],
  validate,
  controller.updateStatus
);

router.patch(
  "/:id/work-notes",
  allowRoles("Admin", "Help Desk", "IT Team", "Network Team", "Cybersecurity"),
  [body("workNotes").notEmpty()],
  validate,
  controller.addWorkNotes
);

router.post(
  "/transfer",
  allowRoles("Admin", "Help Desk", "IT Team", "Network Team", "Cybersecurity"),
  [body("ticketId").isInt(), body("toTeam").isIn(teamEnum), body("note").optional().isString()],
  validate,
  controller.transferTicket
);

router.get("/users/search", allowRoles("Admin", "Help Desk", "IT Team", "Network Team", "Cybersecurity"), controller.searchUsers);

router.delete(
  "/:id",
  allowRoles("Admin", "Help Desk"),
  controller.deleteTicket
);

module.exports = router;
