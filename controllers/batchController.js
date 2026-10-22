const Batch = require("../models/Batch");
const Test = require("../models/Test");
const { logAudit } = require("../utils/auditLogger");

// Add a new food batch
const createBatch = async (req, res) => {
    try {
        const {
            batchId,
            productName,
            productCategory,
            manufacturer,
            quantity,
            unit,
            manufacturingDate,
            expiryDate,
            description,
            status
        } = req.body;

        if (!batchId || !batchId.trim()) {
            return res.status(400).json({ message: "Batch ID is required" });
        }
        if (!productName || !productName.trim()) {
            return res.status(400).json({ message: "Product Name is required" });
        }
        if (!manufacturingDate) {
            return res.status(400).json({ message: "Manufacturing Date is required" });
        }
        if (!expiryDate) {
            return res.status(400).json({ message: "Expiry Date is required" });
        }

        // Check for duplicate Batch ID
        const existing = await Batch.findOne({ batchId: batchId.trim() });
        if (existing) {
            return res.status(400).json({ message: `Batch ID '${batchId.trim()}' already exists in the laboratory records` });
        }

        const batch = await Batch.create({
            batchId: batchId.trim(),
            productName: productName.trim(),
            productCategory: productCategory || "General Food",
            manufacturer: manufacturer || "Internal Lab Facility",
            quantity: quantity ? Number(quantity) : 0,
            unit: unit || "Units",
            manufacturingDate: new Date(manufacturingDate),
            expiryDate: new Date(expiryDate),
            description: description || "",
            status: status || "Pending"
        });

        await logAudit({
            action: "CREATE_BATCH",
            entityType: "Batch",
            entityId: batch._id,
            performedBy: req.user ? req.user.id : null,
            details: { batchId: batch.batchId, productName: batch.productName, status: batch.status }
        });

        res.status(201).json({
            message: "Batch created successfully",
            batch
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Batch ID already exists" });
        }
        res.status(400).json({ message: error.message });
    }
};

// Get all food batches (with optional search and status filter)
const getBatches = async (req, res) => {
    try {
        const { search, status } = req.query;
        const filter = {};

        if (status && status !== "ALL") {
            filter.status = status;
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            filter.$or = [
                { batchId: regex },
                { productName: regex },
                { manufacturer: regex },
                { productCategory: regex }
            ];
        }

        const batches = await Batch.find(filter).sort({ createdAt: -1 });
        res.status(200).json(batches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single batch by ID
const getBatchById = async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found" });
        }
        res.status(200).json(batch);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update an existing batch
const updateBatch = async (req, res) => {
    try {
        const allowedUpdates = [
            "batchId",
            "productName",
            "productCategory",
            "manufacturer",
            "quantity",
            "unit",
            "manufacturingDate",
            "expiryDate",
            "receivedDate",
            "description",
            "status"
        ];

        const batch = await Batch.findById(req.params.id);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found" });
        }

        // If batchId is being changed, check if new ID already exists
        if (req.body.batchId && req.body.batchId.trim() !== batch.batchId) {
            const duplicate = await Batch.findOne({ batchId: req.body.batchId.trim() });
            if (duplicate) {
                return res.status(400).json({ message: `Batch ID '${req.body.batchId.trim()}' is already in use` });
            }
        }

        allowedUpdates.forEach((field) => {
            if (req.body[field] !== undefined) {
                batch[field] = req.body[field];
            }
        });

        await batch.save();

        await logAudit({
            action: "UPDATE_BATCH",
            entityType: "Batch",
            entityId: batch._id,
            performedBy: req.user ? req.user.id : null,
            details: { batchId: batch.batchId, productName: batch.productName }
        });

        res.status(200).json({ message: "Batch updated successfully", batch });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update batch status directly
const updateBatchStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }

        const currentBatch = await Batch.findById(req.params.id);
        if (!currentBatch) {
            return res.status(404).json({ message: "Batch not found" });
        }

        const previousStatus = currentBatch.status;
        currentBatch.status = status;
        await currentBatch.save();

        await logAudit({
            action: "UPDATE_BATCH_STATUS",
            entityType: "Batch",
            entityId: currentBatch._id,
            performedBy: req.user ? req.user.id : null,
            details: { previousStatus, newStatus: status, batchId: currentBatch.batchId }
        });

        res.status(200).json({
            message: `Batch status updated to ${status}`,
            batch: currentBatch
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a batch
const deleteBatch = async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found" });
        }

        const batchId = batch.batchId;
        const productName = batch.productName;

        // Delete associated tests to maintain database consistency
        await Test.deleteMany({ batch: batch._id });
        await Batch.findByIdAndDelete(req.params.id);

        await logAudit({
            action: "DELETE_BATCH",
            entityType: "Batch",
            entityId: String(req.params.id),
            performedBy: req.user ? req.user.id : null,
            details: { batchId, productName }
        });

        res.status(200).json({
            message: `Batch '${batchId}' and linked records deleted successfully`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Dynamic Expiry Monitoring (calculates remaining days and categories)
const getExpiringBatches = async (req, res) => {
    try {
        const { category = "ALL" } = req.query;
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const allBatches = await Batch.find().sort({ expiryDate: 1 });

        const enriched = allBatches.map((batch) => {
            const exp = new Date(batch.expiryDate);
            exp.setHours(0, 0, 0, 0);
            const diffTime = exp.getTime() - now.getTime();
            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isExpired = daysRemaining < 0;

            let expiryCategory = "Safe";
            if (isExpired) {
                expiryCategory = "Expired";
            } else if (daysRemaining <= 30) {
                expiryCategory = "Expiring Soon";
            }

            return {
                ...batch.toObject(),
                daysRemaining,
                isExpired,
                expiryCategory
            };
        });

        // Filter based on requested category
        let filtered = enriched;
        if (category === "Expired") {
            filtered = enriched.filter((b) => b.isExpired);
        } else if (category === "Expiring Soon") {
            filtered = enriched.filter((b) => !b.isExpired && b.daysRemaining <= 30);
        } else if (category === "Safe") {
            filtered = enriched.filter((b) => !b.isExpired && b.daysRemaining > 30);
        }

        const counts = {
            total: enriched.length,
            expired: enriched.filter((b) => b.isExpired).length,
            expiringSoon: enriched.filter((b) => !b.isExpired && b.daysRemaining <= 30).length,
            safe: enriched.filter((b) => !b.isExpired && b.daysRemaining > 30).length
        };

        res.status(200).json({
            counts,
            batches: filtered
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Unified Dashboard Statistics (Live MongoDB calculations)
const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const thresholdDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const [batches, tests] = await Promise.all([
            Batch.find().sort({ createdAt: -1 }),
            Test.find().populate("batch", "batchId productName status").sort({ createdAt: -1 })
        ]);

        const totalBatches = batches.length;
        const approvedBatches = batches.filter((b) => b.status === "Approved").length;
        const rejectedBatches = batches.filter((b) => ["Rejected", "Quarantined"].includes(b.status)).length;
        const pendingBatches = batches.filter((b) => b.status === "Pending").length;
        const testingBatches = batches.filter((b) => ["Under Testing", "In Progress"].includes(b.status)).length;

        const expiringBatches30Days = batches.filter((b) => {
            const exp = new Date(b.expiryDate);
            return exp >= now && exp <= thresholdDate;
        }).length;

        const totalTests = tests.length;
        const testsPending = tests.filter((t) => t.overallResult === "Pending").length;
        const testsInProgress = tests.filter((t) => ["Under Testing", "In Progress", "Under Review"].includes(t.overallResult)).length;
        const passedTests = tests.filter((t) => ["Pass", "Approved", "Passed"].includes(t.overallResult)).length;
        const failedTests = tests.filter((t) => ["Fail", "Rejected", "Failed"].includes(t.overallResult)).length;

        const compliancePercentage = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        const batchReleasePercentage = totalBatches > 0 ? Math.round((approvedBatches / totalBatches) * 100) : 0;

        res.status(200).json({
            totalBatches,
            approvedBatches,
            rejectedBatches,
            pendingBatches,
            testingBatches,
            expiringBatches30Days,
            totalTests,
            testsPending,
            testsInProgress,
            testsUnderTesting: testsInProgress,
            passedTests,
            failedTests,
            compliancePercentage,
            complianceRate: compliancePercentage,
            batchReleasePercentage,
            recentBatches: batches.slice(0, 5),
            recentTests: tests.slice(0, 5)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Certificate of Analysis (COA) and batch traceability
const getBatchTraceability = async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found" });
        }

        const tests = await Test.find({ batch: batch._id })
            .populate("testedBy", "username role")
            .populate("reviewedBy", "username role")
            .sort({ testDate: -1 });

        const totalTests = tests.length;
        const passedTests = tests.filter((t) => ["Pass", "Approved", "Passed"].includes(t.overallResult)).length;
        const failedTests = tests.filter((t) => ["Fail", "Rejected", "Failed"].includes(t.overallResult)).length;
        const pendingTests = tests.filter((t) => ["Pending", "In Progress", "Under Review"].includes(t.overallResult)).length;

        const isCompliant = totalTests > 0 && failedTests === 0 && pendingTests === 0 && batch.status === "Approved";

        res.status(200).json({
            batch,
            traceability: {
                totalTests,
                passedTests,
                failedTests,
                pendingTests,
                complianceStatus: isCompliant ? "COMPLIANT" : (failedTests > 0 ? "NON-COMPLIANT" : "INCOMPLETE"),
                certificateOfAnalysis: {
                    certificateId: `COA-${batch.batchId}`,
                    issuedAt: new Date(),
                    batchNumber: batch.batchId,
                    product: batch.productName,
                    status: batch.status,
                    tests
                }
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createBatch,
    getBatches,
    getBatchById,
    updateBatch,
    updateBatchStatus,
    deleteBatch,
    getExpiringBatches,
    getDashboardStats,
    getBatchTraceability
};
