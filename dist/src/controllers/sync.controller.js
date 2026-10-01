"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncController = void 0;
const sync_service_1 = require("../services/sync/sync.service");
exports.syncController = {
    getDashboard: async (req, res) => {
        try {
            const { companyId } = req.params;
            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: "companyId is required",
                });
            }
            const result = await (0, sync_service_1.getSyncDashboard)(companyId);
            return res.status(200).json({
                success: true,
                result,
            });
        }
        catch (error) {
            console.error("getSyncDashboard error:", error);
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to get sync dashboard",
            });
        }
    },
};
