import type { Request, Response } from "express";
import { importReportAssetTests } from "../../services/reporting/reportAssetTest.service";
import {
  createSync,
  completeSync,
  failSync,
} from "../../services/sync/sync.service";
import { updateSyncEntityConfig } from "../../services/sync/syncEntityConfig.service";

export const reportAssetTestsController = {
  importAssetTests: async (req: Request, res: Response) => {
    let syncId: string | undefined;
    let companyId: string | undefined;

    try {
      const { companyId: requestCompanyId, rows } = req.body;

      companyId = requestCompanyId;

      if (!companyId || !rows) {
        return res.status(400).json({
          success: false,
          message: "companyId and rows are required",
        });
      }

      if (!Array.isArray(rows)) {
        return res.status(400).json({
          success: false,
          message: "rows must be an array",
        });
      }

      const sync = await createSync({
        companyId,
        provider: "Import-Simpro",
        entity: "Asset Tests",
      });

      syncId = sync.id;

      const result = await importReportAssetTests(companyId, rows);

      await completeSync(sync.id, {
        recordsRead: rows.length,
        recordsSaved: result.imported,
        recordsFailed: result.errors.length,
      });

      await updateSyncEntityConfig({
        companyId,
        provider: "Import-Simpro",
        entity: "Asset Tests",
        totalRecords: result.imported,
        status: "completed",
      });

      return res.status(200).json({
        success: true,
        message: "Asset tests imported successfully",
        result,
      });
    } catch (error: any) {
      console.error("importReportAssetTests error:", error);

      if (syncId) {
        await failSync(syncId, error.message ?? "Failed to import asset tests");
      }

      if (companyId) {
        await updateSyncEntityConfig({
          companyId,
          provider: "Import-Simpro",
          entity: "Asset Tests",
          totalRecords: 0,
          status: "failed",
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message ?? "Failed to import asset tests",
      });
    }
  },
};
