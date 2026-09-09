import type { Request, Response } from "express";
import { syncJobCostCenters } from "../services/jobCostCenter.service";

export const jobCostCenterSyncController = {
  // =========================================
  // SYNC ALL JOB COST CENTERS
  // =========================================
  syncJobCostCenters: async (req: Request, res: Response) => {
    try {
      const { companyId, simproCompanyId } = req.body;

      if (!companyId || !simproCompanyId) {
        return res.status(400).json({
          success: false,
          message: "companyId and simproCompanyId are required",
        });
      }

      const result = await syncJobCostCenters(companyId, simproCompanyId);

      return res.status(200).json({
        success: true,
        message: "Job cost centers synced successfully",
        result,
      });
    } catch (error: any) {
      console.error("syncJobCostCenters error:", error);

      return res.status(500).json({
        success: false,
        message: error.message ?? "Failed to sync job cost centers",
      });
    }
  },
};
