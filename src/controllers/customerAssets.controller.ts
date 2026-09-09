import type { Request, Response } from "express";
import { syncCustomerAssets } from "../services/customerAssets.service";

export const customerAssetController = {
  // =========================================
  // SYNC CUSTOMER ASSETS
  // =========================================
  syncCustomerAssets: async (req: Request, res: Response) => {
    try {
      const { companyId, simproCompanyId } = req.body;

      if (!companyId || !simproCompanyId) {
        return res.status(400).json({
          success: false,
          message: "companyId and simproCompanyId are required",
        });
      }

      const result = await syncCustomerAssets(companyId, simproCompanyId);

      return res.status(200).json({
        success: true,
        message: "Customer assets synced successfully",
        result,
      });
    } catch (error: any) {
      console.error("syncCustomerAssets error:", error);

      return res.status(500).json({
        success: false,
        message: error.message ?? "Failed to sync customer assets",
      });
    }
  },
};
