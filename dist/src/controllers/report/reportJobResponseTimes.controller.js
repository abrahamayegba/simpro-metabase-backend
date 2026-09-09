"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportJobResponseTimesController = void 0;
const reportJobResponseTimes_service_1 = require("../../services/reporting/reportJobResponseTimes.service");
const sync_service_1 = require("../../services/sync/sync.service");
const syncEntityConfig_service_1 = require("../../services/sync/syncEntityConfig.service");
exports.reportJobResponseTimesController = {
    importJobResponseTimes: async (req, res) => {
        let syncId;
        let companyId;
        try {
            const { companyId: requestCompanyId, rows } = req.body;
            companyId = requestCompanyId;
            if (!companyId || !rows) {
                return res.status(400).json({
                    success: false,
                    message: "companyId and rows are required",
                });
            }
            if (!Array.isArray(rows)) {
                return res.status(400).json({
                    success: false,
                    message: "rows must be an array",
                });
            }
            const sync = await (0, sync_service_1.createSync)({
                companyId,
                provider: "Import-Simpro",
                entity: "JobResponseTimes",
            });
            syncId = sync.id;
            const result = await (0, reportJobResponseTimes_service_1.importReportJobResponseTimes)(companyId, rows);
            await (0, sync_service_1.completeSync)(sync.id, {
                recordsRead: rows.length,
                recordsSaved: result.imported,
                recordsFailed: result.errors.length,
            });
            await (0, syncEntityConfig_service_1.updateSyncEntityConfig)({
                companyId,
                provider: "Import-Simpro",
                entity: "JobResponseTimes",
                totalRecords: result.imported,
                status: "completed",
            });
            return res.status(200).json({
                success: true,
                message: "Job response times imported successfully",
                result,
            });
        }
        catch (error) {
            console.error("importReportJobResponseTimes error:", error);
            if (syncId) {
                await (0, sync_service_1.failSync)(syncId, error.message ?? "Failed to import job response times");
            }
            if (companyId) {
                await (0, syncEntityConfig_service_1.updateSyncEntityConfig)({
                    companyId,
                    provider: "Import-Simpro",
                    entity: "JobResponseTimes",
                    totalRecords: 0,
                    status: "failed",
                });
            }
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to import job response times",
            });
        }
    },
};
