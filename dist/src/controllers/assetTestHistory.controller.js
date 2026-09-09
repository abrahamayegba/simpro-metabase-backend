"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetTestHistorySyncController = void 0;
const assetTestHistory_service_1 = require("../services/assetTestHistory.service");
exports.assetTestHistorySyncController = {
    // =========================================
    // SYNC ASSET TEST HISTORY
    // =========================================
    syncAssetTestHistory: async (req, res) => {
        try {
            const { companyId, simproCompanyId } = req.body;
            if (!companyId || !simproCompanyId) {
                return res.status(400).json({
                    success: false,
                    message: "companyId and simproCompanyId are required",
                });
            }
            const result = await (0, assetTestHistory_service_1.syncAssetTestHistory)(companyId, simproCompanyId);
            return res.status(200).json({
                success: true,
                message: "Asset test history synced successfully",
                result,
            });
        }
        catch (error) {
            console.error("syncAssetTestHistory error:", error);
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to sync asset test history",
            });
        }
    },
};
