"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportAssetTestsController = void 0;
const reportAssetTest_service_1 = require("../../services/reporting/reportAssetTest.service");
const sync_service_1 = require("../../services/sync/sync.service");
const syncEntityConfig_service_1 = require("../../services/sync/syncEntityConfig.service");
exports.reportAssetTestsController = {
    importAssetTests: async (req, res) => {
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
                entity: "Asset Tests",
            });
            syncId = sync.id;
            const result = await (0, reportAssetTest_service_1.importReportAssetTests)(companyId, rows);
            await (0, sync_service_1.completeSync)(sync.id, {
                recordsRead: rows.length,
                recordsSaved: result.imported,
                recordsFailed: result.errors.length,
            });
            await (0, syncEntityConfig_service_1.updateSyncEntityConfig)({
                companyId,
                provider: "Import-Simpro",
                entity: "Asset Tests",
                totalRecords: result.imported,
                status: "completed",
            });
            return res.status(200).json({
                success: true,
                message: "Asset tests imported successfully",
                result,
            });
        }
        catch (error) {
            console.error("importReportAssetTests error:", error);
            if (syncId) {
                await (0, sync_service_1.failSync)(syncId, error.message ?? "Failed to import asset tests");
            }
            if (companyId) {
                await (0, syncEntityConfig_service_1.updateSyncEntityConfig)({
                    companyId,
                    provider: "Import-Simpro",
                    entity: "Asset Tests",
                    totalRecords: 0,
                    status: "failed",
                });
            }
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to import asset tests",
            });
        }
    },
};
