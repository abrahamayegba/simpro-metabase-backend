import { Router } from "express";
import { reportSitesController } from "../../controllers/report/reportSites.controller";

export const reportSitesRoutes = Router();

reportSitesRoutes.post("/sync", reportSitesController.syncSites);
