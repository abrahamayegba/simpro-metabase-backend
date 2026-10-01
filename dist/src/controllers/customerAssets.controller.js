"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerAssetController = void 0;
const customerAssets_service_1 = require("../services/customerAssets.service");
exports.customerAssetController = {
    // =========================================
    // SYNC CUSTOMER ASSETS
    // =========================================
    syncCustomerAssets: async (req, res) => {
        try {
            const { companyId, simproCompanyId } = req.body;
            if (!companyId || !simproCompanyId) {
                return res.status(400).json({
                    success: false,
                    message: "companyId and simproCompanyId are required",
                });
            }
            const result = await (0, customerAssets_service_1.syncCustomerAssets)(companyId, simproCompanyId);
            return res.status(200).json({
                success: true,
                message: "Customer assets synced successfully",
                result,
            });
        }
        catch (error) {
            console.error("syncCustomerAssets error:", error);
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to sync customer assets",
            });
        }
    },
};
