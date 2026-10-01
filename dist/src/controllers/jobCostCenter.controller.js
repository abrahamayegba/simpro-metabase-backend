"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobCostCenterSyncController = void 0;
const jobCostCenter_service_1 = require("../services/jobCostCenter.service");
exports.jobCostCenterSyncController = {
    // =========================================
    // SYNC ALL JOB COST CENTERS
    // =========================================
    syncJobCostCenters: async (req, res) => {
        try {
            const { companyId, simproCompanyId } = req.body;
            if (!companyId || !simproCompanyId) {
                return res.status(400).json({
                    success: false,
                    message: "companyId and simproCompanyId are required",
                });
            }
            const result = await (0, jobCostCenter_service_1.syncJobCostCenters)(companyId, simproCompanyId);
            return res.status(200).json({
                success: true,
                message: "Job cost centers synced successfully",
                result,
            });
        }
        catch (error) {
            console.error("syncJobCostCenters error:", error);
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to sync job cost centers",
            });
        }
    },
};
