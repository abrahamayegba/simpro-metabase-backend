import { Router } from "express";
import { reportInvoicesController } from "../../controllers/report/reportInvoices.controller";

export const reportInvoicesRoutes = Router();

reportInvoicesRoutes.post("/sync", reportInvoicesController.syncInvoices);
