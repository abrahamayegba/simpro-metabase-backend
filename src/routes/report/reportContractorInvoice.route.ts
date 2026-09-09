import { Router } from "express";
import { reportContractorInvoicesController } from "../../controllers/report/reportContractorInvoices.controller";

export const reportContractorInvoicesRoutes = Router();

reportContractorInvoicesRoutes.post(
  "/sync",
  reportContractorInvoicesController.syncContractorInvoices,
);
