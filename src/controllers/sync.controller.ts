import type { Request, Response } from "express";
import {
  cancelSync,
  getActiveSyncForEntity,
  getActiveSyncs,
  getSyncById,
  getSyncDashboard,
} from "../services/sync/sync.service";
import { cancelSyncJob } from "../services/sync/syncCancellation.service";

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

  getById: async (req: Request, res: Response) => {
    try {
      const sync = await getSyncById(req.params.syncId);

      if (!sync) {
        return res.status(404).json({ success: false, message: "Sync not found" });
      }

      return res.status(200).json({ success: true, result: sync });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message ?? "Failed to get sync",
      });
    }
  },

  getActive: async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;
      const entity = typeof req.query.entity === "string" ? req.query.entity : undefined;

      if (!companyId) {
        return res.status(400).json({ success: false, message: "companyId is required" });
      }

      const sync = entity
        ? await getActiveSyncForEntity(companyId, entity)
        : await getActiveSyncs(companyId);

      return res.status(200).json({ success: true, result: sync });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message ?? "Failed to get active sync",
      });
    }
  },

  cancel: async (req: Request, res: Response) => {
    try {
      const { syncId } = req.params;
      const existing = await getSyncById(syncId);

      if (!existing) {
        return res.status(404).json({ success: false, message: "Sync not found" });
      }

      cancelSyncJob(syncId);
      const sync = await cancelSync(syncId);

      return res.status(200).json({ success: true, result: sync });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message ?? "Failed to cancel sync",
      });
    }
  },
};
