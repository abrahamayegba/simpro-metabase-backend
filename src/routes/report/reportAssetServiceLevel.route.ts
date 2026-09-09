import { Router } from "express";
import { reportAssetServiceLevelsController } from "../../controllers/report/reportAssetServiceLevels.controller";

export const reportAssetServiceLevelsRoutes = Router();

reportAssetServiceLevelsRoutes.post(
  "/sync",
  reportAssetServiceLevelsController.syncAssetServiceLevels,
);
