import type { Request, Response } from "express";
import { syncAssetTestHistory } from "../services/assetTestHistory.service";

export const assetTestHistorySyncController = {
  // =========================================
  // SYNC ASSET TEST HISTORY
  // =========================================
  syncAssetTestHistory: async (req: Request, res: Response) => {
    try {
      const { companyId, simproCompanyId } = req.body;

      if (!companyId || !simproCompanyId) {
        return res.status(400).json({
          success: false,
          message: "companyId and simproCompanyId are required",
        });
      }

      const result = await syncAssetTestHistory(companyId, simproCompanyId);

      return res.status(200).json({
        success: true,
        message: "Asset test history synced successfully",
        result,
      });
    } catch (error: any) {
      console.error("syncAssetTestHistory error:", error);
      return res.status(500).json({
        success: false,
        message: error.message ?? "Failed to sync asset test history",
      });
    }
  },
};
