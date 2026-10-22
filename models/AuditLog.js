const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        trim: true
    },
    entityType: {
        type: String,
        enum: ["Batch", "Test", "User"],
        required: true
    },
    entityId: {
        type: String,
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
