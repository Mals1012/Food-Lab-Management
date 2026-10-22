const mongoose = require("mongoose");

const manualTestSchema = new mongoose.Schema({
    assessmentId: {
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
    productName: {
        type: String,
        required: true,
        trim: true
    },
    evaluationDate: {
        type: Date,
        default: Date.now
    },
    evaluatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // 1. Safety Evaluation
    safetyVerdict: {
        type: String,
        enum: [
            "Safe for Consumption",
            "Conditionally Safe",
            "Unsafe - Contaminated",
            "Hazard Detected",
            "Pending Evaluation"
        ],
        default: "Safe for Consumption"
    },
    foreignMatterDetected: {
        type: Boolean,
        default: false
    },
    foreignMatterDetails: {
        type: String,
        trim: true,
        default: ""
    },
    packagingIntegrity: {
        type: String,
        enum: [
            "Intact & Hermetically Sealed",
            "Minor External Wear (Safe)",
            "Seal Broken / Leaking (Unsafe)",
            "Damaged Packaging / Contaminated"
        ],
        default: "Intact & Hermetically Sealed"
    },
    allergenSafetyCheck: {
        type: String,
        enum: [
            "Verified Safe & Accurately Labeled",
            "Potential Cross-Contact Risk",
            "Undeclared Allergen Detected (Critical Risk)",
            "Not Applicable"
        ],
        default: "Verified Safe & Accurately Labeled"
    },
    biologicalRiskScore: {
        type: String,
        enum: ["Low / Negligible", "Medium / Monitor", "High / Hazardous"],
        default: "Low / Negligible"
    },

    // 2. Usability & Utility Evaluation (Fitness for Purpose)
    usabilityRating: {
        type: String,
        enum: [
            "Highly Useful & Premium Fit",
            "Standard & Fit for Purpose",
            "Marginal / Substandard Quality",
            "Unfit for Consumption / Defective"
        ],
        default: "Standard & Fit for Purpose"
    },
    sensoryAppearance: {
        type: String,
        enum: ["Normal & Appetizing", "Slight Discoloration", "Severe Discoloration / Off-Color"],
        default: "Normal & Appetizing"
    },
    sensoryAroma: {
        type: String,
        enum: ["Fresh & Characteristic", "Flat / Faint", "Rancid / Sour Off-Odor"],
        default: "Fresh & Characteristic"
    },
    sensoryTexture: {
        type: String,
        enum: ["Optimal Consistency", "Slightly Off-Texture", "Slimy / Syneresis / Clumpy"],
        default: "Optimal Consistency"
    },
    sensoryTaste: {
        type: String,
        enum: ["Satisfactory & Balanced", "Slightly Bitter/Sour", "Unpalatable / Acrid", "Not Tasted (Safety Risk)"],
        default: "Satisfactory & Balanced"
    },
    functionalUtility: {
        type: String,
        enum: [
            "Fully Useful (Consumer Ready)",
            "Functional with Storage Caution",
            "Degraded Utility (Shortened Life)",
            "Non-Functional / Spoiled"
        ],
        default: "Fully Useful (Consumer Ready)"
    },

    // 3. Final Overall Decision & Notes
    overallDisposition: {
        type: String,
        enum: [
            "Approved - Safe & Useful",
            "Conditionally Approved",
            "Quarantine - Unsafe",
            "Rejected - Defective / Hazard"
        ],
        default: "Approved - Safe & Useful"
    },
    safetyNotes: {
        type: String,
        trim: true,
        default: ""
    },
    usabilitySummary: {
        type: String,
        trim: true,
        default: ""
    },
    correctiveActionRequired: {
        type: String,
        trim: true,
        default: ""
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("ManualTest", manualTestSchema);
