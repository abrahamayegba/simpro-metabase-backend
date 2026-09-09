import type { Request, Response } from "express";
import { syncEmployees } from "../services/employee.service";

export const employeeSyncController = {
  // =========================================
  // SYNC ACTIVE EMPLOYEES ONLY
  // =========================================
  syncActiveEmployees: async (req: Request, res: Response) => {
    try {
      const { companyId, simproCompanyId } = req.body;

      if (!companyId || !simproCompanyId) {
        return res.status(400).json({
          success: false,
          message: "companyId and simproCompanyId are required",
        });
      }

      const result = await syncEmployees(companyId, simproCompanyId, false);

      return res.status(200).json({
        success: true,
        message: "Active employees synced successfully",
        result,
      });
    } catch (error: any) {
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
  syncEmployees: async (req: Request, res: Response) => {
    try {
      const { companyId, simproCompanyId, includeArchived } = req.body;

      if (!companyId || !simproCompanyId) {
        return res.status(400).json({
          success: false,
          message: "companyId and simproCompanyId are required",
        });
      }

      const result = await syncEmployees(
        companyId,
        simproCompanyId,
        Boolean(includeArchived)
      );

      return res.status(200).json({
        success: true,
        message: includeArchived
          ? "Employees (including archived) synced successfully"
          : "Active employees synced successfully",
        result,
      });
    } catch (error: any) {
      console.error("syncEmployees error:", error);
      return res.status(500).json({
        success: false,
        message: error.message ?? "Failed to sync employees",
      });
    }
  },
};
