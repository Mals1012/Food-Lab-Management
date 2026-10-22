const AuditLog = require("../models/AuditLog");

const logAudit = async ({ action, entityType, entityId, performedBy, details = {} }) => {
    try {
        await AuditLog.create({
            action,
            entityType,
            entityId: String(entityId),
            performedBy,
            details,
            timestamp: new Date()
        });
    } catch (err) {
        console.error("Audit logging error:", err.message);
    }
};

module.exports = { logAudit };
