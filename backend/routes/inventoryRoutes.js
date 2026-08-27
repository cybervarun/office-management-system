const express = require("express");
const { body, query } = require("express-validator");
const controller = require("../controllers/inventoryController");
const auth = require("../middlewares/auth");
const allowRoles = require("../middlewares/rbac");
const validate = require("../middlewares/validate");

const router = express.Router();

router.use(auth);

/**
 * Updated validators for government inventory format
 * Validates mandatory fields only - optional fields are allowed to be empty
 */
const inventoryValidators = [
  // Require at least one hardware identifier (serial_number OR mac_address)
  body().custom((_, { req }) => {
    if (!req.body.serial_number && !req.body.mac_address) {
      throw new Error("Either serial_number or mac_address is required to generate or bind an Asset ID");
    }
    return true;
  }),

  // Section 1: Basic Information - Mandatory fields
  body("ministry").notEmpty().withMessage("Ministry is required"),
  body("department").notEmpty().withMessage("Department is required"),
  body("asset_id").optional(), // generated server-side if absent
  body("asset_category").notEmpty().withMessage("Asset Category is required"),

  // Section 2: Asset Location
  body("block_name").optional(),
  body("floor").optional(),
  body("room").optional(),
  body("workstation").optional(),

  // Section 3: Asset Details - Mandatory
  body("asset_description").notEmpty().withMessage("Asset Description is required"),
  body("serial_number").optional().isLength({ max: 200 }).withMessage("serial_number too long"),
  body("mac_address").optional().custom(value => {
    if (value && !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(value)) {
      throw new Error("Invalid MAC address format");
    }
    return true;
  }),
  body("ip_address").optional().custom(value => {
    if (value && !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) {
      throw new Error("Invalid IP address format");
    }
    return true;
  }),

  // Section 4: Security & Management
  body("edr_installed").optional(),
  body("reason_no_edr").optional(),
  body("uem_installed").optional(),
  body("reason_no_uem").optional(),

  // Section 5: Ownership & Assignment - Mandatory
  body("asset_user").notEmpty().withMessage("Asset User is required"),
  body("asset_custodian").notEmpty().withMessage("Asset Custodian is required"),
  body("asset_current_status").notEmpty().withMessage("Asset Current Status is required"),

  // Section 6: Lifecycle & Support
  body("purchase_date").optional().isISO8601(),
  body("installation_date").optional().isISO8601(),
  body("date_of_removal").optional().isISO8601(),
  body("end_of_support_date").optional().isISO8601(),
  body("end_of_life_date").optional().isISO8601(),
  body("amc_warranty_expiry_date").optional().isISO8601(),
  body("critical").optional(),
  body("remarks").optional(),

  // Optional fields
  body("sr_no").optional(),
  body("mdo_location").optional(),
  body("division").optional(),
  body("other_asset_category").optional(),
  body("operating_system").optional(),
  body("other_operating_system").optional(),
  body("network_connection_type").optional(),
  body("make_brand_model").optional(),
  body("amc_warranty").optional(),

  // Legacy fields (for backward compatibility)
  body("designation").optional(),
  body("email").optional().isEmail({ require_tld: false }),
  body("phone").optional(),
  body("custodian").optional()
];

router.get("/dropdowns", allowRoles("Admin", "Help Desk", "IT Team", "Network Team", "Cybersecurity"), controller.dropdowns);
router.get("/search-user", allowRoles("Admin", "Help Desk", "IT Team", "Network Team", "Cybersecurity"), [query("q").optional().isString()], validate, controller.userSearch);
router.get("/", allowRoles("Admin", "Help Desk", "IT Team", "Network Team", "Cybersecurity"), controller.listAssets);
router.get("/:id", allowRoles("Admin", "Help Desk", "IT Team", "Network Team", "Cybersecurity"), controller.getAsset);
router.post("/", allowRoles("Admin", "Help Desk"), inventoryValidators, validate, controller.addAsset);
const editAssetValidators = [
  body("asset_id").optional().isLength({ max: 50 }),
  body("asset_category").optional().isLength({ max: 100 }),
  body("asset_description").optional().isLength({ max: 500 }),
  body("serial_number").optional().isLength({ max: 200 }),
  body("mac_address").optional().custom(value => {
    if (value && !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(value)) {
      throw new Error("Invalid MAC address format");
    }
    return true;
  }),
  body("ip_address").optional().custom(value => {
    if (value && !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) {
      throw new Error("Invalid IP address format");
    }
    return true;
  }),
  body("asset_user").optional().isLength({ max: 200 }),
  body("asset_custodian").optional().isLength({ max: 200 }),
  body("asset_current_status").optional().isIn(["Available", "Assigned", "In Maintenance", "Retired", "Lost", "Damaged"]),
  body("mdo_location").optional().isLength({ max: 200 }),
  body("ministry").optional().isLength({ max: 200 }),
  body("department").optional().isLength({ max: 200 }),
  body("division").optional().isLength({ max: 200 }),
  body("block_name").optional().isLength({ max: 200 }),
  body("floor").optional().isLength({ max: 100 }),
  body("room").optional().isLength({ max: 100 }),
  body("workstation").optional().isLength({ max: 100 }),
  body("make_brand_model").optional().isLength({ max: 300 }),
  body("operating_system").optional().isLength({ max: 200 }),
  body("remarks").optional().isLength({ max: 1000 }),
  body("email").optional().isEmail({ require_tld: false }),
  body("phone").optional().isLength({ max: 50 }),
  body("purchase_date").optional().isISO8601(),
  body("installation_date").optional().isISO8601(),
  body("critical").optional().isBoolean(),
  body("sr_no").optional().isInt(),
];
router.put("/:id", allowRoles("Admin", "Help Desk"), editAssetValidators, validate, controller.editAsset);
router.delete("/:id", allowRoles("Admin", "Help Desk"), controller.deleteAsset);
router.post(
  "/dropdowns",
  allowRoles("Admin", "Help Desk", "IT Team", "Network Team", "Cybersecurity"),
  [
    body("field").isString().notEmpty().withMessage("Field is required"),
    body("value").isString().notEmpty().withMessage("Value is required")
  ],
  validate,
  controller.addDropdownValue
);

module.exports = router;
