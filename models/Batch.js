const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema({
    batchId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    productName: {
        type: String,
        required: true,
        trim: true
    },
    productCategory: {
        type: String,
        trim: true,
        default: "General Food"
    },
    manufacturer: {
        type: String,
        trim: true
    },
    quantity: {
        type: Number,
        default: 0
    },
    unit: {
        type: String,
        trim: true,
        default: "Units"
    },
    manufacturingDate: {
        type: Date,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    receivedDate: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        trim: true,
        default: ""
    },
    status: {
        type: String,
        enum: [
            "Pending",
            "Under Testing",
            "In Progress",
            "Approved",
            "Rejected",
            "Quarantined",
            "On Hold",
            "Expired"
        ],
        default: "Pending"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Batch", batchSchema);
