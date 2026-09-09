"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobSyncController = void 0;
const jobs_service_1 = require("../services/jobs.service");
exports.jobSyncController = {
    // =========================================
    // SYNC ACTIVE JOBS ONLY (archived = false)
    // =========================================
    syncActiveJobs: async (req, res) => {
        try {
            const { companyId, simproCompanyId } = req.body;
            if (!companyId || !simproCompanyId) {
                return res.status(400).json({
                    success: false,
                    message: "companyId and simproCompanyId are required",
                });
            }
            const result = await (0, jobs_service_1.syncJobs)(companyId, simproCompanyId, false);
            return res.status(200).json({
                success: true,
                message: "Active jobs synced successfully",
                result,
            });
        }
        catch (error) {
            console.error("syncActiveJobs error:", error);
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to sync active jobs",
            });
        }
    },
    // =========================================
    // SYNC JOBS (USER CONTROLS ARCHIVED)
    // =========================================
    syncJobs: async (req, res) => {
        try {
            const { companyId, includeArchived, simproCompanyId } = req.body;
            if (!companyId || !simproCompanyId) {
                return res.status(400).json({
                    success: false,
                    message: "companyId and simproCompanyId are required",
                });
            }
            const result = await (0, jobs_service_1.syncJobs)(companyId, simproCompanyId, Boolean(includeArchived));
            return res.status(200).json({
                success: true,
                message: includeArchived
                    ? "Jobs (including archived) synced successfully"
                    : "Active jobs synced successfully",
                result,
            });
        }
        catch (error) {
            console.error("syncJobs error:", error);
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to sync jobs",
            });
        }
    },
};
