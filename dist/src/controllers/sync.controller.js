"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncController = void 0;
const sync_service_1 = require("../services/sync/sync.service");
const syncCancellation_service_1 = require("../services/sync/syncCancellation.service");
exports.syncController = {
    getDashboard: async (req, res) => {
        try {
            const { companyId } = req.params;
            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: "companyId is required",
                });
            }
            const result = await (0, sync_service_1.getSyncDashboard)(companyId);
            return res.status(200).json({
                success: true,
                result,
            });
        }
        catch (error) {
            console.error("getSyncDashboard error:", error);
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to get sync dashboard",
            });
        }
    },
    getById: async (req, res) => {
        try {
            const sync = await (0, sync_service_1.getSyncById)(req.params.syncId);
            if (!sync) {
                return res.status(404).json({ success: false, message: "Sync not found" });
            }
            return res.status(200).json({ success: true, result: sync });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to get sync",
            });
        }
    },
    getActive: async (req, res) => {
        try {
            const { companyId } = req.params;
            const entity = typeof req.query.entity === "string" ? req.query.entity : undefined;
            if (!companyId) {
                return res.status(400).json({ success: false, message: "companyId is required" });
            }
            const sync = entity
                ? await (0, sync_service_1.getActiveSyncForEntity)(companyId, entity)
                : await (0, sync_service_1.getActiveSyncs)(companyId);
            return res.status(200).json({ success: true, result: sync });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to get active sync",
            });
        }
    },
    cancel: async (req, res) => {
        try {
            const { syncId } = req.params;
            const existing = await (0, sync_service_1.getSyncById)(syncId);
            if (!existing) {
                return res.status(404).json({ success: false, message: "Sync not found" });
            }
            (0, syncCancellation_service_1.cancelSyncJob)(syncId);
            const sync = await (0, sync_service_1.cancelSync)(syncId);
            return res.status(200).json({ success: true, result: sync });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to cancel sync",
            });
        }
    },
};
