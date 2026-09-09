import { Router } from "express";
import { reportContractorJobsController } from "../../controllers/report/reportContractorJobs.controller";
export const reportContractorJobsRoutes = Router();

reportContractorJobsRoutes.post(
  "/sync",
  reportContractorJobsController.syncContractorJobs,
);
