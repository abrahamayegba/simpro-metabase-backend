import { Router } from "express";
import { reportJobResponseTimesController } from "../../controllers/report/reportJobResponseTimes.controller";

export const reportJobResponseTimesRoutes = Router();

// Import job response time CSV snapshot
reportJobResponseTimesRoutes.post(
  "/import",
  reportJobResponseTimesController.importJobResponseTimes,
);
