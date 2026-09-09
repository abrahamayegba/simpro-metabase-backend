"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerSyncController = void 0;
const customer_service_1 = require("../services/customer.service");
exports.customerSyncController = {
    // =========================================
    // SYNC ACTIVE CUSTOMERS ONLY
    // =========================================
    syncActiveCustomers: async (req, res) => {
        try {
            const { companyId, simproCompanyId } = req.body;
            if (!companyId || !simproCompanyId) {
                return res.status(400).json({
                    success: false,
                    message: "companyId and simproCompanyId are required",
                });
            }
            const result = await (0, customer_service_1.syncCustomers)(companyId, simproCompanyId, false);
            return res.status(200).json({
                success: true,
                message: "Active customers synced successfully",
                result,
            });
        }
        catch (error) {
            console.error("syncActiveCustomers error:", error);
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to sync active customers",
            });
        }
    },
    // =========================================
    // SYNC CUSTOMERS (USER CONTROLS ARCHIVED)
    // =========================================
    syncCustomers: async (req, res) => {
        try {
            const { companyId, simproCompanyId, includeArchived } = req.body;
            if (!companyId || !simproCompanyId) {
                return res.status(400).json({
                    success: false,
                    message: "companyId and simproCompanyId are required",
                });
            }
            const result = await (0, customer_service_1.syncCustomers)(companyId, simproCompanyId, Boolean(includeArchived));
            return res.status(200).json({
                success: true,
                message: includeArchived
                    ? "Customers (including archived) synced successfully"
                    : "Active customers synced successfully",
                result,
            });
        }
        catch (error) {
            console.error("syncCustomers error:", error);
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to sync customers",
            });
        }
    },
};
