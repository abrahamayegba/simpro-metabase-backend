"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractorJobSyncController = void 0;
const contractorJob_service_1 = require("../services/contractorJob.service");
exports.contractorJobSyncController = {
    // =========================================
    // SYNC CONTRACTOR JOBS
    // =========================================
    syncContractorJobs: async (req, res) => {
        try {
            const { companyId, simproCompanyId } = req.body;
            if (!companyId || !simproCompanyId) {
                return res.status(400).json({
                    success: false,
                    message: "companyId and simproCompanyId are required",
                });
            }
            const result = await (0, contractorJob_service_1.syncContractorJobs)(companyId, simproCompanyId);
            return res.status(200).json({
                success: true,
                message: "Contractor jobs synced successfully",
                result,
            });
        }
        catch (error) {
            console.error("syncContractorJobs error:", error);
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to sync contractor jobs",
            });
        }
    },
};
