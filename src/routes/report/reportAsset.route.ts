import { Router } from "express";
import { reportAssetsController } from "../../controllers/report/reportAssets.controller";

export const reportAssetsRoutes = Router();

reportAssetsRoutes.post("/sync", reportAssetsController.syncAssets);
