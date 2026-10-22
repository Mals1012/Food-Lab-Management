const AuditLog = require("../models/AuditLog");

// Get audit logs with filtering and pagination
const getAuditLogs = async (req, res) => {
    try {
        const { action, entityType, entityId, limit = 50, page = 1 } = req.query;
        const filter = {};

        if (action) filter.action = action;
        if (entityType) filter.entityType = entityType;
        if (entityId) filter.entityId = entityId;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .populate("performedBy", "username role")
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            AuditLog.countDocuments(filter)
        ]);

        res.status(200).json({
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            logs
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAuditLogs };
