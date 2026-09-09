import { Router } from "express";
import { reportResponseTimesController } from "../../controllers/report/reportResponseTimes.controller";
export const reportResponseTimesRoutes = Router();

reportResponseTimesRoutes.post(
  "/sync",
  reportResponseTimesController.syncResponseTimes,
);
