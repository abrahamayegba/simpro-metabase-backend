"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportSchedulesController = void 0;
const reportSchedule_service_1 = require("../../services/reporting/reportSchedule.service");
const sync_service_1 = require("../../services/sync/sync.service");
const syncEntityConfig_service_1 = require("../../services/sync/syncEntityConfig.service");
exports.reportSchedulesController = {
    syncSchedules: async (req, res) => {
        let syncId;
        let companyId;
        try {
            const { companyId: requestCompanyId, simproCompanyId } = req.body;
            companyId = requestCompanyId;
            if (!companyId || !simproCompanyId) {
                return res.status(400).json({
                    success: false,
                    message: "companyId and simproCompanyId are required",
                });
            }
            const sync = await (0, sync_service_1.createSync)({
                companyId,
                provider: "Simpro",
                entity: "Schedules",
            });
            syncId = sync.id;
            const result = await (0, reportSchedule_service_1.syncReportSchedules)(companyId, simproCompanyId);
            await (0, sync_service_1.completeSync)(sync.id, {
                recordsRead: result.fetched,
                recordsSaved: result.upserted,
                recordsFailed: result.errors.length,
            });
            await (0, syncEntityConfig_service_1.updateSyncEntityConfig)({
                companyId,
                provider: "Simpro",
                entity: "Schedules",
                totalRecords: result.upserted,
                status: "completed",
            });
            return res.status(200).json({
                success: true,
                message: "Schedules synced successfully",
                result,
            });
        }
        catch (error) {
            console.error("syncReportSchedules error:", error);
            if (syncId) {
                await (0, sync_service_1.failSync)(syncId, error.message ?? "Failed to sync schedules");
            }
            if (companyId) {
                await (0, syncEntityConfig_service_1.updateSyncEntityConfig)({
                    companyId,
                    provider: "Simpro",
                    entity: "Schedules",
                    totalRecords: 0,
                    status: "failed",
                });
            }
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to sync schedules",
            });
        }
    },
};
