import type { Request, Response } from "express";
import { syncReportCustomers } from "../../services/reporting/reportCustomer.service";
import {
  createSync,
  completeSync,
  failSync,
  getSyncById,
} from "../../services/sync/sync.service";
import { updateSyncEntityConfig } from "../../services/sync/syncEntityConfig.service";

export const reportCustomersController = {
  syncCustomers: async (req: Request, res: Response) => {
    const { companyId, simproCompanyId } = req.body;

    if (!companyId || !simproCompanyId) {
      return res.status(400).json({
        success: false,
        message: "companyId and simproCompanyId are required",
      });
    }

    const sync = await createSync({
      companyId,
      provider: "Simpro",
      entity: "Customers",
    });

    // respond straight away, run the actual sync after
    res.status(202).json({ success: true, syncId: sync.id });

    syncReportCustomers(companyId, simproCompanyId)
      .then(async (result) => {
        await completeSync(sync.id, {
          recordsRead: result.fetched,
          recordsSaved: result.upserted,
          recordsFailed: result.errors.length,
        });

        await updateSyncEntityConfig({
          companyId,
          provider: "Simpro",
          entity: "Customers",
          totalRecords: result.upserted,
          status: "completed",
        });
      })
      .catch(async (error: any) => {
        console.error("syncReportCustomers error:", error);

        await failSync(sync.id, error.message ?? "Failed to sync customers");

        await updateSyncEntityConfig({
          companyId,
          provider: "Simpro",
          entity: "Customers",
          totalRecords: 0,
          status: "failed",
        });
      });
  },

  getSyncStatus: async (req: Request, res: Response) => {
    const { syncId } = req.params;
    const sync = await getSyncById(syncId);

    if (!sync) {
      return res
        .status(404)
        .json({ success: false, message: "Sync not found" });
    }

    return res.status(200).json({ success: true, sync });
  },
};
