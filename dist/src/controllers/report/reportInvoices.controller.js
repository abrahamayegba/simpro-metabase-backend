"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportInvoicesController = void 0;
const reportInvoice_service_1 = require("../../services/reporting/reportInvoice.service");
const sync_service_1 = require("../../services/sync/sync.service");
const syncEntityConfig_service_1 = require("../../services/sync/syncEntityConfig.service");
exports.reportInvoicesController = {
    syncInvoices: async (req, res) => {
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
                entity: "Invoices",
            });
            syncId = sync.id;
            const result = await (0, reportInvoice_service_1.syncReportInvoices)(companyId, simproCompanyId);
            await (0, sync_service_1.completeSync)(sync.id, {
                recordsRead: result.fetched,
                recordsSaved: result.upserted,
                recordsFailed: result.errors.length,
            });
            await (0, syncEntityConfig_service_1.updateSyncEntityConfig)({
                companyId,
                provider: "Simpro",
                entity: "Invoices",
                totalRecords: result.upserted,
                status: "completed",
            });
            return res.status(200).json({
                success: true,
                message: "Invoices synced successfully",
                result,
            });
        }
        catch (error) {
            console.error("syncReportInvoices error:", error);
            if (syncId) {
                await (0, sync_service_1.failSync)(syncId, error.message ?? "Failed to sync invoices");
            }
            if (companyId) {
                await (0, syncEntityConfig_service_1.updateSyncEntityConfig)({
                    companyId,
                    provider: "Simpro",
                    entity: "Invoices",
                    totalRecords: 0,
                    status: "failed",
                });
            }
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to sync invoices",
            });
        }
    },
};
