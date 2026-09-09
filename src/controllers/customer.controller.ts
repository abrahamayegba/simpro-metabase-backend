import type { Request, Response } from "express";
import { syncCustomers } from "../services/customer.service";

export const customerSyncController = {
  // =========================================
  // SYNC ACTIVE CUSTOMERS ONLY
  // =========================================
  syncActiveCustomers: async (req: Request, res: Response) => {
    try {
      const { companyId, simproCompanyId } = req.body;

      if (!companyId || !simproCompanyId) {
        return res.status(400).json({
          success: false,
          message: "companyId and simproCompanyId are required",
        });
      }

      const result = await syncCustomers(companyId, simproCompanyId, false);

      return res.status(200).json({
        success: true,
        message: "Active customers synced successfully",
        result,
      });
    } catch (error: any) {
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
  syncCustomers: async (req: Request, res: Response) => {
    try {
      const { companyId, simproCompanyId, includeArchived } = req.body;

      if (!companyId || !simproCompanyId) {
        return res.status(400).json({
          success: false,
          message: "companyId and simproCompanyId are required",
        });
      }

      const result = await syncCustomers(
        companyId,
        simproCompanyId,
        Boolean(includeArchived)
      );

      return res.status(200).json({
        success: true,
        message: includeArchived
          ? "Customers (including archived) synced successfully"
          : "Active customers synced successfully",
        result,
      });
    } catch (error: any) {
      console.error("syncCustomers error:", error);
      return res.status(500).json({
        success: false,
        message: error.message ?? "Failed to sync customers",
      });
    }
  },
};
