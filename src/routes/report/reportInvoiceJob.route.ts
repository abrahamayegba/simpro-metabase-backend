import { Router } from "express";
import { reportInvoiceJobsController } from "../../controllers/report/reportInvoiceJobs.controller";

export const reportInvoiceJobsRoutes = Router();

reportInvoiceJobsRoutes.post(
  "/sync",
  reportInvoiceJobsController.syncInvoiceJobs,
);
