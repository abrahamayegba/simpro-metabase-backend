"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quoteSyncController = void 0;
const quote_service_1 = require("../services/quote.service");
exports.quoteSyncController = {
    // =========================================
    // SYNC ACTIVE QUOTES ONLY
    // =========================================
    syncActiveQuotes: async (req, res) => {
        try {
            const { companyId, simproCompanyId } = req.body;
            if (!companyId || !simproCompanyId) {
                return res.status(400).json({
                    success: false,
                    message: "companyId and simproCompanyId are required",
                });
            }
            const result = await (0, quote_service_1.syncQuotes)(companyId, simproCompanyId, false);
            return res.status(200).json({
                success: true,
                message: "Active quotes synced successfully",
                result,
            });
        }
        catch (error) {
            console.error("syncActiveQuotes error:", error);
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to sync active quotes",
            });
        }
    },
    // =========================================
    // SYNC QUOTES (USER CONTROLS ARCHIVED)
    // =========================================
    syncQuotes: async (req, res) => {
        try {
            const { companyId, simproCompanyId, includeArchived } = req.body;
            if (!companyId || !simproCompanyId) {
                return res.status(400).json({
                    success: false,
                    message: "companyId and simproCompanyId are required",
                });
            }
            const result = await (0, quote_service_1.syncQuotes)(companyId, simproCompanyId, Boolean(includeArchived));
            return res.status(200).json({
                success: true,
                message: includeArchived
                    ? "Quotes (including archived) synced successfully"
                    : "Active quotes synced successfully",
                result,
            });
        }
        catch (error) {
            console.error("syncQuotes error:", error);
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to sync quotes",
            });
        }
    },
};
