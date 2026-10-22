const express = require("express");
const router = express.Router();

const {
    createTest,
    getAllTests,
    getTestById,
    updateTestResults,
    startTesting,
    submitForReview,
    reviewTest,
    deleteTest
} = require("../controllers/testController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All test endpoints require an authenticated user
router.use(protect);

// Create a new quality / chemical test
router.post(
    "/",
    authorize("Admin", "Lab Manager", "Lab Analyst", "Lab Technician"),
    createTest
);

// Get all test records
router.get("/", getAllTests);

// Get a single test by ID
router.get("/:id", getTestById);

// Update test parameter values and observations
router.put(
    "/:id",
    authorize("Admin", "Lab Manager", "Lab Analyst", "Lab Technician"),
    updateTestResults
);

// Workflow step: Start Testing (Pending -> Under Testing)
router.patch(
    "/:id/start-testing",
    authorize("Admin", "Lab Manager", "Lab Analyst", "Lab Technician"),
    startTesting
);

// Workflow step: Submit for QA Review (Under Testing -> Under Review)
router.patch(
    "/:id/submit-review",
    authorize("Admin", "Lab Manager", "Lab Analyst", "Lab Technician"),
    submitForReview
);

// Review and approve/reject test (QA review)
router.patch(
    "/:id/review",
    authorize("Admin", "Lab Manager", "Quality Manager"),
    reviewTest
);

// Delete test record
router.delete(
    "/:id",
    authorize("Admin", "Lab Manager", "Quality Manager"),
    deleteTest
);

module.exports = router;
