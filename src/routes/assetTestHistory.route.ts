import { Router } from "express";
import { assetTestHistorySyncController } from "../controllers/assetTestHistory.controller";

export const assetTestHistorySyncRoutes = Router();

assetTestHistorySyncRoutes.post(
  "/sync",
  assetTestHistorySyncController.syncAssetTestHistory
);
