const express = require("express");
const router = express.Router();

const {
    createManualTest,
    getAllManualTests,
    getManualTestById,
    updateManualTest,
    deleteManualTest,
    getManualTestStats
} = require("../controllers/manualTestController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All manual safety test endpoints require an authenticated user
router.use(protect);

// Summary stats for safety & usability dashboard
router.get("/stats", getManualTestStats);

// List all manual safety tests with optional filters
router.get("/", getAllManualTests);

// Get single manual test by ID
router.get("/:id", getManualTestById);

// Record new manual safety & usability evaluation
router.post(
    "/",
    authorize("Admin", "Lab Manager", "Lab Analyst", "Lab Technician", "Quality Manager"),
    createManualTest
);

// Update manual evaluation details
router.put(
    "/:id",
    authorize("Admin", "Lab Manager", "Lab Analyst", "Lab Technician", "Quality Manager"),
    updateManualTest
);

// Delete manual test record
router.delete(
    "/:id",
    authorize("Admin", "Lab Manager", "Quality Manager"),
    deleteManualTest
);

module.exports = router;
