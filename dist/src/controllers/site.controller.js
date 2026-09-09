"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.siteSyncController = void 0;
const site_service_1 = require("../services/site.service");
exports.siteSyncController = {
    // =========================================
    // SYNC ACTIVE SITES ONLY
    // =========================================
    syncActiveSites: async (req, res) => {
        try {
            const { companyId, simproCompanyId } = req.body;
            if (!companyId || !simproCompanyId) {
                return res.status(400).json({
                    success: false,
                    message: "companyId and simproCompanyId are required",
                });
            }
            const result = await (0, site_service_1.syncSites)(companyId, simproCompanyId, false);
            return res.status(200).json({
                success: true,
                message: "Active sites synced successfully",
                result,
            });
        }
        catch (error) {
            console.error("syncActiveSites error:", error);
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to sync active sites",
            });
        }
    },
    // =========================================
    // SYNC SITES (USER CONTROLS ARCHIVED)
    // =========================================
    syncSites: async (req, res) => {
        try {
            const { companyId, simproCompanyId, includeArchived } = req.body;
            if (!companyId || !simproCompanyId) {
                return res.status(400).json({
                    success: false,
                    message: "companyId and simproCompanyId are required",
                });
            }
            const result = await (0, site_service_1.syncSites)(companyId, simproCompanyId, Boolean(includeArchived));
            return res.status(200).json({
                success: true,
                message: includeArchived
                    ? "Sites (including archived) synced successfully"
                    : "Active sites synced successfully",
                result,
            });
        }
        catch (error) {
            console.error("syncSites error:", error);
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to sync sites",
            });
        }
    },
};
