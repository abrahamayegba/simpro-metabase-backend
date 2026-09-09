import { Router } from "express";
import { customerAssetController } from "../controllers/customerAssets.controller";

export const customerAssetsSyncRoutes = Router();

// No archived jobs
customerAssetsSyncRoutes.post(
  "/sync",
  customerAssetController.syncCustomerAssets
);
