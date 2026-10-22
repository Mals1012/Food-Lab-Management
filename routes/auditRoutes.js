const express = require("express");
const router = express.Router();

const { getAuditLogs } = require("../controllers/auditController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All audit log endpoints require authentication
router.use(protect);

// Only Admin, Lab Manager, and Quality Manager can view regulatory audit logs
router.get("/", authorize("Admin", "Lab Manager", "Quality Manager"), getAuditLogs);

module.exports = router;
