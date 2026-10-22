const ManualTest = require("../models/ManualTest");
const Batch = require("../models/Batch");
const { logAudit } = require("../utils/auditLogger");

// Create a new Manual Safety & Usability Test
const createManualTest = async (req, res) => {
    try {
        const {
            assessmentId,
            batch: batchId,
            productName,
            evaluationDate,
            safetyVerdict,
            foreignMatterDetected,
            foreignMatterDetails,
            packagingIntegrity,
            allergenSafetyCheck,
            biologicalRiskScore,
            usabilityRating,
            sensoryAppearance,
            sensoryAroma,
            sensoryTexture,
            sensoryTaste,
            functionalUtility,
            overallDisposition,
            safetyNotes,
            usabilitySummary,
            correctiveActionRequired,
            syncBatchStatus = true
        } = req.body;

        if (!assessmentId || !assessmentId.trim()) {
            return res.status(400).json({ message: "Assessment ID is required" });
        }
        if (!batchId) {
            return res.status(400).json({ message: "Food Batch reference is required" });
        }

        // Check duplicate Assessment ID
        const existing = await ManualTest.findOne({ assessmentId: assessmentId.trim() });
        if (existing) {
            return res.status(400).json({
                message: `Assessment ID '${assessmentId.trim()}' already exists. Please assign a unique identifier.`
            });
        }

        // Verify batch exists
        const batch = await Batch.findById(batchId);
        if (!batch) {
            return res.status(404).json({ message: "Referenced Food Batch not found" });
        }

        const newTest = new ManualTest({
            assessmentId: assessmentId.trim(),
            batch: batchId,
            productName: productName || batch.productName,
            evaluationDate: evaluationDate ? new Date(evaluationDate) : new Date(),
            evaluatedBy: req.user ? req.user.id : null,
            safetyVerdict: safetyVerdict || "Safe for Consumption",
            foreignMatterDetected: Boolean(foreignMatterDetected),
            foreignMatterDetails: foreignMatterDetails || "",
            packagingIntegrity: packagingIntegrity || "Intact & Hermetically Sealed",
            allergenSafetyCheck: allergenSafetyCheck || "Verified Safe & Accurately Labeled",
            biologicalRiskScore: biologicalRiskScore || "Low / Negligible",
            usabilityRating: usabilityRating || "Standard & Fit for Purpose",
            sensoryAppearance: sensoryAppearance || "Normal & Appetizing",
            sensoryAroma: sensoryAroma || "Fresh & Characteristic",
            sensoryTexture: sensoryTexture || "Optimal Consistency",
            sensoryTaste: sensoryTaste || "Satisfactory & Balanced",
            functionalUtility: functionalUtility || "Fully Useful (Consumer Ready)",
            overallDisposition: overallDisposition || "Approved - Safe & Useful",
            safetyNotes: safetyNotes || "",
            usabilitySummary: usabilitySummary || "",
            correctiveActionRequired: correctiveActionRequired || ""
        });

        const savedTest = await newTest.save();

        // Synchronize batch status if requested
        if (syncBatchStatus) {
            if (overallDisposition === "Quarantine - Unsafe") {
                batch.status = "Quarantined";
                await batch.save();
            } else if (overallDisposition === "Rejected - Defective / Hazard") {
                batch.status = "Rejected";
                await batch.save();
            } else if (overallDisposition === "Approved - Safe & Useful" && batch.status === "Pending") {
                batch.status = "Approved";
                await batch.save();
            }
        }

        // Audit Trail
        await logAudit({
            action: "CREATE_MANUAL_TEST",
            entityType: "ManualTest",
            entityId: savedTest._id,
            performedBy: req.user ? req.user.id : null,
            details: {
                assessmentId: savedTest.assessmentId,
                productName: savedTest.productName,
                safetyVerdict: savedTest.safetyVerdict,
                usabilityRating: savedTest.usabilityRating,
                overallDisposition: savedTest.overallDisposition
            }
        });

        const populated = await ManualTest.findById(savedTest._id)
            .populate("batch", "batchId productName productCategory status expiryDate")
            .populate("evaluatedBy", "username role");

        res.status(201).json({
            message: `Manual safety & usability evaluation '${savedTest.assessmentId}' recorded successfully`,
            assessment: populated
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all Manual Safety Tests
const getAllManualTests = async (req, res) => {
    try {
        const { safetyVerdict, usabilityRating, disposition, search } = req.query;
        let query = {};

        if (safetyVerdict && safetyVerdict !== "ALL") {
            query.safetyVerdict = safetyVerdict;
        }
        if (usabilityRating && usabilityRating !== "ALL") {
            query.usabilityRating = usabilityRating;
        }
        if (disposition && disposition !== "ALL") {
            query.overallDisposition = disposition;
        }
        if (search) {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [
                { assessmentId: regex },
                { productName: regex },
                { safetyNotes: regex }
            ];
        }

        const assessments = await ManualTest.find(query)
            .populate("batch", "batchId productName productCategory status expiryDate manufacturer")
            .populate("evaluatedBy", "username role")
            .sort({ createdAt: -1 });

        res.status(200).json(assessments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single assessment by ID
const getManualTestById = async (req, res) => {
    try {
        const assessment = await ManualTest.findById(req.params.id)
            .populate("batch", "batchId productName productCategory status expiryDate manufacturer quantity unit")
            .populate("evaluatedBy", "username role");

        if (!assessment) {
            return res.status(404).json({ message: "Manual test evaluation not found" });
        }

        res.status(200).json(assessment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update assessment
const updateManualTest = async (req, res) => {
    try {
        const assessment = await ManualTest.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ message: "Manual test evaluation not found" });
        }

        const updatableFields = [
            "productName",
            "evaluationDate",
            "safetyVerdict",
            "foreignMatterDetected",
            "foreignMatterDetails",
            "packagingIntegrity",
            "allergenSafetyCheck",
            "biologicalRiskScore",
            "usabilityRating",
            "sensoryAppearance",
            "sensoryAroma",
            "sensoryTexture",
            "sensoryTaste",
            "functionalUtility",
            "overallDisposition",
            "safetyNotes",
            "usabilitySummary",
            "correctiveActionRequired"
        ];

        updatableFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                assessment[field] = req.body[field];
            }
        });

        await assessment.save();

        if (req.body.syncBatchStatus && assessment.batch) {
            const batch = await Batch.findById(assessment.batch);
            if (batch) {
                if (assessment.overallDisposition === "Quarantine - Unsafe") {
                    batch.status = "Quarantined";
                    await batch.save();
                } else if (assessment.overallDisposition === "Rejected - Defective / Hazard") {
                    batch.status = "Rejected";
                    await batch.save();
                } else if (assessment.overallDisposition === "Approved - Safe & Useful") {
                    batch.status = "Approved";
                    await batch.save();
                }
            }
        }

        await logAudit({
            action: "UPDATE_MANUAL_TEST",
            entityType: "ManualTest",
            entityId: assessment._id,
            performedBy: req.user ? req.user.id : null,
            details: {
                assessmentId: assessment.assessmentId,
                overallDisposition: assessment.overallDisposition
            }
        });

        const updated = await ManualTest.findById(assessment._id)
            .populate("batch", "batchId productName productCategory status")
            .populate("evaluatedBy", "username role");

        res.status(200).json({
            message: "Manual safety & usability evaluation updated successfully",
            assessment: updated
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete assessment
const deleteManualTest = async (req, res) => {
    try {
        const assessment = await ManualTest.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ message: "Manual test evaluation not found" });
        }

        await ManualTest.findByIdAndDelete(req.params.id);

        await logAudit({
            action: "DELETE_MANUAL_TEST",
            entityType: "ManualTest",
            entityId: assessment._id,
            performedBy: req.user ? req.user.id : null,
            details: { assessmentId: assessment.assessmentId }
        });

        res.status(200).json({
            message: `Manual test evaluation '${assessment.assessmentId}' deleted successfully`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Summary Statistics for Safety & Usability Dashboard
const getManualTestStats = async (req, res) => {
    try {
        const tests = await ManualTest.find();
        const total = tests.length;
        const safeCount = tests.filter((t) => t.safetyVerdict === "Safe for Consumption").length;
        const usefulCount = tests.filter((t) =>
            ["Highly Useful & Premium Fit", "Standard & Fit for Purpose"].includes(t.usabilityRating)
        ).length;
        const hazardCount = tests.filter((t) =>
            ["Unsafe - Contaminated", "Hazard Detected"].includes(t.safetyVerdict) ||
            t.overallDisposition === "Quarantine - Unsafe"
        ).length;
        const approvedCount = tests.filter((t) => t.overallDisposition === "Approved - Safe & Useful").length;

        const safetyComplianceRate = total > 0 ? Math.round((safeCount / total) * 100) : 0;
        const usabilityFitRate = total > 0 ? Math.round((usefulCount / total) * 100) : 0;

        res.status(200).json({
            total,
            safeCount,
            usefulCount,
            hazardCount,
            approvedCount,
            safetyComplianceRate,
            usabilityFitRate
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createManualTest,
    getAllManualTests,
    getManualTestById,
    updateManualTest,
    deleteManualTest,
    getManualTestStats
};
