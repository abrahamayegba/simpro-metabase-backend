import type { Request, Response } from "express";
import { syncContractorJobs } from "../services/contractorJob.service";

export const contractorJobSyncController = {
  // =========================================
  // SYNC CONTRACTOR JOBS
  // =========================================
  syncContractorJobs: async (req: Request, res: Response) => {
    try {
      const { companyId, simproCompanyId } = req.body;

      if (!companyId || !simproCompanyId) {
        return res.status(400).json({
          success: false,
          message: "companyId and simproCompanyId are required",
        });
      }

      const result = await syncContractorJobs(companyId, simproCompanyId);

      return res.status(200).json({
        success: true,
        message: "Contractor jobs synced successfully",
        result,
      });
    } catch (error: any) {
      console.error("syncContractorJobs error:", error);

      return res.status(500).json({
        success: false,
        message: error.message ?? "Failed to sync contractor jobs",
      });
    }
  },
};
