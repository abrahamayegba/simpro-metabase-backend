"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportJobCostCentresController = void 0;
const reportJobCostCentre_service_1 = require("../../services/reporting/reportJobCostCentre.service");
const sync_service_1 = require("../../services/sync/sync.service");
const syncEntityConfig_service_1 = require("../../services/sync/syncEntityConfig.service");
exports.reportJobCostCentresController = {
    syncJobCostCentres: async (req, res) => {
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
                entity: "Job Cost Centres",
            });
            syncId = sync.id;
            const result = await (0, reportJobCostCentre_service_1.syncReportJobCostCentres)(companyId, simproCompanyId);
            await (0, sync_service_1.completeSync)(sync.id, {
                recordsRead: result.fetched,
                recordsSaved: result.upserted,
                recordsFailed: result.errors.length,
            });
            await (0, syncEntityConfig_service_1.updateSyncEntityConfig)({
                companyId,
                provider: "Simpro",
                entity: "Job Cost Centres",
                totalRecords: result.upserted,
                status: "completed",
            });
            return res.status(200).json({
                success: true,
                message: "Job cost centres synced successfully",
                result,
            });
        }
        catch (error) {
            console.error("syncReportJobCostCentres error:", error);
            if (syncId) {
                await (0, sync_service_1.failSync)(syncId, error.message ?? "Failed to sync job cost centres");
            }
            if (companyId) {
                await (0, syncEntityConfig_service_1.updateSyncEntityConfig)({
                    companyId,
                    provider: "Simpro",
                    entity: "Job Cost Centres",
                    totalRecords: 0,
                    status: "failed",
                });
            }
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to sync job cost centres",
            });
        }
    },
};
