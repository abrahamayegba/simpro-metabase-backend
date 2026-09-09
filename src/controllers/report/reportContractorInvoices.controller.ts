import type { Request, Response } from "express";
import { syncReportContractorInvoices } from "../../services/reporting/reportContractorInvoice.service";
import {
  createSync,
  completeSync,
  failSync,
} from "../../services/sync/sync.service";
import { updateSyncEntityConfig } from "../../services/sync/syncEntityConfig.service";

export const reportContractorInvoicesController = {
  syncContractorInvoices: async (req: Request, res: Response) => {
    let syncId: string | undefined;
    let companyId: string | undefined;

    try {
      const { companyId: requestCompanyId, simproCompanyId } = req.body;

      companyId = requestCompanyId;

      if (!companyId || !simproCompanyId) {
        return res.status(400).json({
          success: false,
          message: "companyId and simproCompanyId are required",
        });
      }

      const sync = await createSync({
        companyId,
        provider: "Simpro",
        entity: "Contractor Invoices",
      });

      syncId = sync.id;

      const result = await syncReportContractorInvoices(
        companyId,
        simproCompanyId,
      );

      await completeSync(sync.id, {
        recordsRead: result.fetched,
        recordsSaved: result.upserted,
        recordsFailed: result.errors.length,
      });

      await updateSyncEntityConfig({
        companyId,
        provider: "Simpro",
        entity: "Contractor Invoices",
        totalRecords: result.upserted,
        status: "completed",
      });

      return res.status(200).json({
        success: true,
        message: "Contractor invoices synced successfully",
        result,
      });
    } catch (error: any) {
      console.error("syncReportContractorInvoices error:", error);

      if (syncId) {
        await failSync(
          syncId,
          error.message ?? "Failed to sync contractor invoices",
        );
      }

      if (companyId) {
        await updateSyncEntityConfig({
          companyId,
          provider: "Simpro",
          entity: "Contractor Invoices",
          totalRecords: 0,
          status: "failed",
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message ?? "Failed to sync contractor invoices",
      });
    }
  },
};
