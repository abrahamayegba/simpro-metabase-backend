import { Router } from "express";
import { reportAssetTestsController } from "../../controllers/report/reportAssetTests.controller";

export const reportAssetTestsRoutes = Router();

// Import asset test CSV snapshot
reportAssetTestsRoutes.post(
  "/import",
  reportAssetTestsController.importAssetTests,
);
