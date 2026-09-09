import type { Request, Response } from "express";
import { syncJobs } from "../services/jobs.service";

export const jobSyncController = {
  // =========================================
  // SYNC JOBS (USER CONTROLS ARCHIVED)
  // =========================================
  syncJobs: async (req: Request, res: Response) => {
    try {
      const { companyId, includeArchived, simproCompanyId } = req.body;

      if (!companyId || !simproCompanyId) {
        return res.status(400).json({
          success: false,
          message: "companyId and simproCompanyId are required",
        });
      }

      const result = await syncJobs(
        companyId,
        simproCompanyId,
        Boolean(includeArchived)
      );

      return res.status(200).json({
        success: true,
        message: includeArchived
          ? "Jobs (including archived) synced successfully"
          : "Active jobs synced successfully",
        result,
      });
    } catch (error: any) {
      console.error("syncJobs error:", error);
      return res.status(500).json({
        success: false,
        message: error.message ?? "Failed to sync jobs",
      });
    }
  },
};
