const mongoose = require("mongoose");

const testParameterSchema = new mongoose.Schema({
    parameterName: {
        type: String,
        required: true,
        trim: true
    },
    standardRange: {
        type: String,
        trim: true
    },
    minValue: {
        type: Number
    },
    maxValue: {
        type: Number
    },
    observedValue: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    unit: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ["Pending", "Pass", "Fail", "Inconclusive"],
        default: "Pending"
    }
}, { _id: true });

const testSchema = new mongoose.Schema({
    testId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
        required: true
    },
    testName: {
        type: String,
        trim: true,
        default: "Food Quality & Safety Test"
    },
    productName: {
        type: String,
        trim: true
    },
    sampleName: {
        type: String,
        required: true,
        trim: true
    },
    testType: {
        type: String,
        default: "Chemical & Microbiological Analysis"
    },
    phValue: {
        type: Number
    },
    moisturePercentage: {
        type: Number
    },
    chemicalAnalysisResults: {
        type: String,
        trim: true,
        default: ""
    },
    microbiologicalTestResults: {
        type: String,
        trim: true,
        default: ""
    },
    parameters: [testParameterSchema],
    overallResult: {
        type: String,
        enum: [
            "Pending",
            "Under Testing",
            "In Progress",
            "Passed",
            "Failed",
            "Approved",
            "Rejected",
            "Under Review"
        ],
        default: "Pending"
    },
    testedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    testDate: {
        type: Date,
        default: Date.now
    },
    remarks: {
        type: String,
        trim: true,
        default: ""
    },
    rejectionReason: {
        type: String,
        trim: true,
        default: ""
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Test", testSchema);
