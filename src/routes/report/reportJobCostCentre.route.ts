import { Router } from "express";
import { reportJobCostCentresController } from "../../controllers/report/reportJobCostCentres.controller";

export const reportJobCostCentresRoutes = Router();

reportJobCostCentresRoutes.post(
  "/sync",
  reportJobCostCentresController.syncJobCostCentres,
);
