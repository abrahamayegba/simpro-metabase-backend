"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeSyncController = void 0;
const employee_service_1 = require("../services/employee.service");
exports.employeeSyncController = {
    // =========================================
    // SYNC ACTIVE EMPLOYEES ONLY
    // =========================================
    syncActiveEmployees: async (req, res) => {
        try {
            const { companyId, simproCompanyId } = req.body;
            if (!companyId || !simproCompanyId) {
                return res.status(400).json({
                    success: false,
                    message: "companyId and simproCompanyId are required",
                });
            }
            const result = await (0, employee_service_1.syncEmployees)(companyId, simproCompanyId, false);
            return res.status(200).json({
                success: true,
                message: "Active employees synced successfully",
                result,
            });
        }
        catch (error) {
            console.error("syncActiveEmployees error:", error);
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to sync active employees",
            });
        }
    },
    // =========================================
    // SYNC EMPLOYEES (USER CONTROLS ARCHIVED)
    // =========================================
    syncEmployees: async (req, res) => {
        try {
            const { companyId, simproCompanyId, includeArchived } = req.body;
            if (!companyId || !simproCompanyId) {
                return res.status(400).json({
                    success: false,
                    message: "companyId and simproCompanyId are required",
                });
            }
            const result = await (0, employee_service_1.syncEmployees)(companyId, simproCompanyId, Boolean(includeArchived));
            return res.status(200).json({
                success: true,
                message: includeArchived
                    ? "Employees (including archived) synced successfully"
                    : "Active employees synced successfully",
                result,
            });
        }
        catch (error) {
            console.error("syncEmployees error:", error);
            return res.status(500).json({
                success: false,
                message: error.message ?? "Failed to sync employees",
            });
        }
    },
};
