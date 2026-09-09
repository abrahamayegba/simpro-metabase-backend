import type { Request, Response } from "express";
import { getSyncDashboard } from "../services/sync/sync.service";

export const syncController = {
  getDashboard: async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: "companyId is required",
        });
      }

      const result = await getSyncDashboard(companyId);

      return res.status(200).json({
        success: true,
        result,
      });
    } catch (error: any) {
      console.error("getSyncDashboard error:", error);

      return res.status(500).json({
        success: false,
        message: error.message ?? "Failed to get sync dashboard",
      });
    }
  },
};
