import { Router } from "express";
import { reportQuotesController } from "../../controllers/report/reportQuotes.controller";
export const reportQuotesRoutes = Router();

reportQuotesRoutes.post("/sync", reportQuotesController.syncQuotes);
