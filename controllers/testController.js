const Test = require("../models/Test");
const Batch = require("../models/Batch");
const { logAudit } = require("../utils/auditLogger");

// Helper function to evaluate parameter pass/fail if bounds are present
const evaluateParameterStatus = (param) => {
    if (param.status && param.status !== "Pending") {
        return param.status;
    }
    const val = Number(param.observedValue);
    if (!isNaN(val)) {
        if (param.minValue !== undefined && param.minValue !== null && val < param.minValue) {
            return "Fail";
        }
        if (param.maxValue !== undefined && param.maxValue !== null && val > param.maxValue) {
            return "Fail";
        }
        if (
            (param.minValue !== undefined && param.minValue !== null) ||
            (param.maxValue !== undefined && param.maxValue !== null)
        ) {
            return "Pass";
        }
    }
    return param.status || "Pending";
};

// Create a new quality / chemical lab test
const createTest = async (req, res) => {
    try {
        const {
            testId,
            batch: batchId,
            testName,
            sampleName,
            productName,
            testType,
            phValue,
            moisturePercentage,
            chemicalAnalysisResults,
            microbiologicalTestResults,
            parameters = [],
            overallResult,
            testDate,
            remarks
        } = req.body;

        if (!testId || !testId.trim()) {
            return res.status(400).json({ message: "Test ID is required" });
        }
        if (!batchId) {
            return res.status(400).json({ message: "Associated product batch must be selected" });
        }

        // Verify batch exists
        const batch = await Batch.findById(batchId);
        if (!batch) {
            return res.status(404).json({ message: "Selected product batch was not found in database" });
        }

        // Prevent duplicate Test ID
        const existingTest = await Test.findOne({ testId: testId.trim() });
        if (existingTest) {
            return res.status(400).json({ message: `Test ID '${testId.trim()}' already exists` });
        }

        // Process explicit parameters if provided
        const processedParameters = (parameters || []).map((param) => ({
            ...param,
            status: evaluateParameterStatus(param)
        }));

        // Initial status is Pending (unless specified by user)
        const initialStatus = overallResult || "Pending";

        const test = await Test.create({
            testId: testId.trim(),
            batch: batchId,
            testName: testName || `${batch.productName} Quality & Purity Analysis`,
            sampleName: sampleName || `${batch.productName} Lot Specimen (${batch.batchId})`,
            productName: productName || batch.productName,
            testType: testType || "Chemical & Microbiological Analysis",
            phValue: phValue !== undefined && phValue !== "" ? Number(phValue) : undefined,
            moisturePercentage: moisturePercentage !== undefined && moisturePercentage !== "" ? Number(moisturePercentage) : undefined,
            chemicalAnalysisResults: chemicalAnalysisResults || "",
            microbiologicalTestResults: microbiologicalTestResults || "",
            parameters: processedParameters,
            overallResult: initialStatus,
            testedBy: req.user ? req.user.id : null,
            testDate: testDate ? new Date(testDate) : new Date(),
            remarks: remarks || ""
        });

        await logAudit({
            action: "CREATE_TEST",
            entityType: "Test",
            entityId: test._id,
            performedBy: req.user ? req.user.id : null,
            details: { testId: test.testId, batchId: batch.batchId, overallResult: initialStatus }
        });

        const populatedTest = await Test.findById(test._id)
            .populate("batch", "batchId productName status")
            .populate("testedBy", "username role");

        res.status(201).json({
            message: "Lab test recorded successfully with status 'Pending'",
            test: populatedTest
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Test ID already exists" });
        }
        res.status(400).json({ message: error.message });
    }
};

// Get all lab tests with optional filters
const getAllTests = async (req, res) => {
    try {
        const { batch, testType, overallResult, search } = req.query;
        const filter = {};

        if (batch) filter.batch = batch;
        if (testType && testType !== "ALL") filter.testType = testType;
        if (overallResult && overallResult !== "ALL") filter.overallResult = overallResult;

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            filter.$or = [
                { testId: regex },
                { testName: regex },
                { sampleName: regex },
                { productName: regex }
            ];
        }

        const tests = await Test.find(filter)
            .populate("batch", "batchId productName status manufacturingDate expiryDate")
            .populate("testedBy", "username role")
            .populate("reviewedBy", "username role")
            .sort({ createdAt: -1 });

        res.status(200).json(tests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single test by ID
const getTestById = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id)
            .populate("batch", "batchId productName status manufacturingDate expiryDate")
            .populate("testedBy", "username role")
            .populate("reviewedBy", "username role");

        if (!test) {
            return res.status(404).json({ message: "Lab test record not found" });
        }

        res.status(200).json(test);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Edit / Update test results
const updateTestResults = async (req, res) => {
    try {
        const {
            testName,
            sampleName,
            productName,
            testType,
            phValue,
            moisturePercentage,
            chemicalAnalysisResults,
            microbiologicalTestResults,
            parameters,
            remarks,
            overallResult,
            testDate
        } = req.body;

        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: "Lab test record not found" });
        }

        if (testName !== undefined) test.testName = testName;
        if (sampleName !== undefined) test.sampleName = sampleName;
        if (productName !== undefined) test.productName = productName;
        if (testType !== undefined) test.testType = testType;
        if (phValue !== undefined) test.phValue = phValue !== "" ? Number(phValue) : undefined;
        if (moisturePercentage !== undefined) test.moisturePercentage = moisturePercentage !== "" ? Number(moisturePercentage) : undefined;
        if (chemicalAnalysisResults !== undefined) test.chemicalAnalysisResults = chemicalAnalysisResults;
        if (microbiologicalTestResults !== undefined) test.microbiologicalTestResults = microbiologicalTestResults;
        if (remarks !== undefined) test.remarks = remarks;
        if (overallResult !== undefined) test.overallResult = overallResult;
        if (testDate) test.testDate = new Date(testDate);

        if (parameters && Array.isArray(parameters)) {
            test.parameters = parameters.map((param) => ({
                ...param,
                status: evaluateParameterStatus(param)
            }));
        }

        await test.save();

        await logAudit({
            action: "UPDATE_TEST",
            entityType: "Test",
            entityId: test._id,
            performedBy: req.user ? req.user.id : null,
            details: { testId: test.testId, overallResult: test.overallResult }
        });

        const updated = await Test.findById(test._id)
            .populate("batch", "batchId productName status")
            .populate("testedBy", "username role")
            .populate("reviewedBy", "username role");

        res.status(200).json({
            message: "Test results updated successfully",
            test: updated
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Workflow Step 2: "Start Testing" — transitions test to 'Under Testing' and batch to 'Under Testing'
const startTesting = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: "Test record not found" });
        }

        test.overallResult = "Under Testing";
        await test.save();

        // Update associated batch status to Under Testing
        if (test.batch) {
            const batch = await Batch.findById(test.batch);
            if (batch && batch.status === "Pending") {
                batch.status = "Under Testing";
                await batch.save();
            }
        }

        await logAudit({
            action: "START_TESTING",
            entityType: "Test",
            entityId: test._id,
            performedBy: req.user ? req.user.id : null,
            details: { testId: test.testId, newStatus: "Under Testing" }
        });

        const populated = await Test.findById(test._id)
            .populate("batch", "batchId productName status")
            .populate("testedBy", "username role");

        res.status(200).json({
            message: `Laboratory testing initiated for '${test.testId}'`,
            test: populated
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Workflow Step 3: "Submit for Review" — transitions test to 'Under Review'
const submitForReview = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: "Test record not found" });
        }

        test.overallResult = "Under Review";
        await test.save();

        await logAudit({
            action: "SUBMIT_FOR_REVIEW",
            entityType: "Test",
            entityId: test._id,
            performedBy: req.user ? req.user.id : null,
            details: { testId: test.testId, newStatus: "Under Review" }
        });

        const populated = await Test.findById(test._id)
            .populate("batch", "batchId productName status")
            .populate("testedBy", "username role");

        res.status(200).json({
            message: `Test '${test.testId}' submitted for QA review`,
            test: populated
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Workflow Step 4: Review / Approve / Reject quality test (Quality Managers & Admins)
const reviewTest = async (req, res) => {
    try {
        const { overallResult, remarks, rejectionReason, updateBatchStatus = true } = req.body;

        const validOutcomes = ["Approved", "Rejected", "Pass", "Fail", "Under Review", "Under Testing"];
        if (!overallResult || !validOutcomes.includes(overallResult)) {
            return res.status(400).json({
                message: `Valid review verdict (${validOutcomes.join(", ")}) is required`
            });
        }

        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: "Lab test record not found" });
        }

        // Quality Rule Check:
        // "Do not allow a technician to approve their own test results."
        if (
            test.testedBy &&
            String(test.testedBy) === String(req.user.id) &&
            req.user.role !== "Admin"
        ) {
            return res.status(403).json({
                message: "Quality Rule: Technicians/Analysts cannot approve or reject tests they performed themselves. An independent Quality Manager or Admin must review."
            });
        }

        // Quality Rule Check:
        // "Require rejection remarks when a test is rejected."
        const isReject = ["Rejected", "Fail"].includes(overallResult);
        if (isReject && (!rejectionReason || !rejectionReason.trim()) && (!remarks || !remarks.trim())) {
            return res.status(400).json({
                message: "Mandatory requirement: Rejection remarks / reason must be provided when rejecting a quality test."
            });
        }

        // Normalize verdict label
        const normalizedVerdict = isReject ? "Rejected" : (["Approved", "Pass"].includes(overallResult) ? "Approved" : overallResult);

        test.overallResult = normalizedVerdict;
        test.reviewedBy = req.user.id;
        if (remarks !== undefined) test.remarks = remarks;
        if (rejectionReason !== undefined) test.rejectionReason = rejectionReason;

        await test.save();

        // Quality Rule Check:
        // "A batch can be released only when all required tests have passed and an authorized reviewer has approved them."
        let updatedBatch = null;
        if (updateBatchStatus && test.batch) {
            const batch = await Batch.findById(test.batch);
            if (batch) {
                if (normalizedVerdict === "Approved") {
                    batch.status = "Approved";
                } else if (normalizedVerdict === "Rejected") {
                    batch.status = "Rejected";
                } else if (normalizedVerdict === "Under Review") {
                    batch.status = "Under Testing";
                }
                await batch.save();
                updatedBatch = batch;
            }
        }

        const populatedTest = await Test.findById(test._id)
            .populate("batch", "batchId productName status")
            .populate("testedBy", "username role")
            .populate("reviewedBy", "username role");

        await logAudit({
            action: "REVIEW_TEST",
            entityType: "Test",
            entityId: test._id,
            performedBy: req.user.id,
            details: {
                testId: test.testId,
                verdict: normalizedVerdict,
                rejectionReason: test.rejectionReason || null,
                batchUpdated: !!updatedBatch,
                batchStatus: updatedBatch?.status
            }
        });

        res.status(200).json({
            message: `Quality test reviewed: marked as '${normalizedVerdict}'`,
            test: populatedTest,
            batch: updatedBatch
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a lab test record
const deleteTest = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: "Lab test not found" });
        }

        const testId = test.testId;
        await Test.findByIdAndDelete(req.params.id);

        await logAudit({
            action: "DELETE_TEST",
            entityType: "Test",
            entityId: String(req.params.id),
            performedBy: req.user ? req.user.id : null,
            details: { testId }
        });

        res.status(200).json({ message: `Lab test '${testId}' deleted successfully` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createTest,
    getAllTests,
    getTestById,
    updateTestResults,
    startTesting,
    submitForReview,
    reviewTest,
    deleteTest
};
