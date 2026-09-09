"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportCustomersController = void 0;
const reportCustomer_service_1 = require("../../services/reporting/reportCustomer.service");
const sync_service_1 = require("../../services/sync/sync.service");
const syncEntityConfig_service_1 = require("../../services/sync/syncEntityConfig.service");
exports.reportCustomersController = {
    syncCustomers: async (req, res) => {
        const { companyId, simproCompanyId } = req.body;
        if (!companyId || !simproCompanyId) {
            return res.status(400).json({
                success: false,
                message: "companyId and simproCompanyId are required",
            });
        }
        const sync = await (0, sync_service_1.createSync)({
            companyId,
            provider: "Simpro",
            entity: "Customers",
        });
        // respond straight away, run the actual sync after
        res.status(202).json({ success: true, syncId: sync.id });
        (0, reportCustomer_service_1.syncReportCustomers)(companyId, simproCompanyId)
            .then(async (result) => {
            await (0, sync_service_1.completeSync)(sync.id, {
                recordsRead: result.fetched,
                recordsSaved: result.upserted,
                recordsFailed: result.errors.length,
            });
            await (0, syncEntityConfig_service_1.updateSyncEntityConfig)({
                companyId,
                provider: "Simpro",
                entity: "Customers",
                totalRecords: result.upserted,
                status: "completed",
            });
        })
            .catch(async (error) => {
            console.error("syncReportCustomers error:", error);
            await (0, sync_service_1.failSync)(sync.id, error.message ?? "Failed to sync customers");
            await (0, syncEntityConfig_service_1.updateSyncEntityConfig)({
                companyId,
                provider: "Simpro",
                entity: "Customers",
                totalRecords: 0,
                status: "failed",
            });
        });
    },
    getSyncStatus: async (req, res) => {
        const { syncId } = req.params;
        const sync = await (0, sync_service_1.getSyncById)(syncId);
        if (!sync) {
            return res
                .status(404)
                .json({ success: false, message: "Sync not found" });
        }
        return res.status(200).json({ success: true, sync });
    },
};
