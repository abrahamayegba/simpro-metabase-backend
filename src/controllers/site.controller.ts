import type { Request, Response } from "express";
import { syncSites } from "../services/site.service";

export const siteSyncController = {
  // =========================================
  // SYNC ACTIVE SITES ONLY
  // =========================================
  syncActiveSites: async (req: Request, res: Response) => {
    try {
      const { companyId, simproCompanyId } = req.body;

      if (!companyId || !simproCompanyId) {
        return res.status(400).json({
          success: false,
          message: "companyId and simproCompanyId are required",
        });
      }

      const result = await syncSites(companyId, simproCompanyId, false);

      return res.status(200).json({
        success: true,
        message: "Active sites synced successfully",
        result,
      });
    } catch (error: any) {
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
  syncSites: async (req: Request, res: Response) => {
    try {
      const { companyId, simproCompanyId, includeArchived } = req.body;

      if (!companyId || !simproCompanyId) {
        return res.status(400).json({
          success: false,
          message: "companyId and simproCompanyId are required",
        });
      }

      const result = await syncSites(
        companyId,
        simproCompanyId,
        Boolean(includeArchived)
      );

      return res.status(200).json({
        success: true,
        message: includeArchived
          ? "Sites (including archived) synced successfully"
          : "Active sites synced successfully",
        result,
      });
    } catch (error: any) {
      console.error("syncSites error:", error);
      return res.status(500).json({
        success: false,
        message: error.message ?? "Failed to sync sites",
      });
    }
  },
};
