const express = require("express");
const router = express.Router();

const {
    createBatch,
    getBatches,
    getBatchById,
    updateBatch,
    updateBatchStatus,
    deleteBatch,
    getExpiringBatches,
    getDashboardStats,
    getBatchTraceability
} = require("../controllers/batchController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All batch endpoints require a valid JWT
router.use(protect);

// Dashboard live stats (must be placed before /:id)
router.get("/stats", getDashboardStats);

// Get batches nearing expiry or expired (registered before /:id)
router.get("/expiring", getExpiringBatches);

// Create a new batch (Admin, Lab Manager, Lab Analyst, Lab Technician, Production Staff, Production Manager)
router.post(
    "/",
    authorize("Admin", "Lab Manager", "Lab Analyst", "Lab Technician", "Production Staff", "Production Manager"),
    createBatch
);

// Get all batches (all authenticated roles)
router.get("/", getBatches);

// Get a batch by ID (all authenticated roles)
router.get("/:id", getBatchById);

// Get complete traceability report and Certificate of Analysis (COA)
router.get("/:id/traceability", getBatchTraceability);

// Fully update a batch (Admin, Lab Manager, Lab Analyst, Lab Technician, Production Staff, Production Manager)
router.put(
    "/:id",
    authorize("Admin", "Lab Manager", "Lab Analyst", "Lab Technician", "Production Staff", "Production Manager"),
    updateBatch
);

// Update a batch's status (Admin, Lab Manager, Quality Manager)
router.patch(
    "/:id/status",
    authorize("Admin", "Lab Manager", "Quality Manager"),
    updateBatchStatus
);

// Delete a batch (Admin, Lab Manager, Production Staff, Production Manager)
router.delete(
    "/:id",
    authorize("Admin", "Lab Manager", "Production Staff", "Production Manager"),
    deleteBatch
);

module.exports = router;
