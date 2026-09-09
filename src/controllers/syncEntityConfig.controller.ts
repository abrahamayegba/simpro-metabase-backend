import type { Request, Response } from "express";
import {
  getCsvEntities,
  getSyncEntities,
} from "../services/sync/syncEntityConfig.service";

export const syncEntityConfigController = {
  getEntities: async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: "companyId is required",
        });
      }

      const [syncEntities, csvEntities] = await Promise.all([
        getSyncEntities(companyId, "Simpro"),
        getCsvEntities(companyId),
      ]);

      return res.status(200).json({
        success: true,
        result: {
          syncEntities,
          csvEntities,
        },
      });
    } catch (error: any) {
      console.error("getSyncEntities error:", error);

      return res.status(500).json({
        success: false,
        message: error.message ?? "Failed to get sync entities",
      });
    }
  },
};
