import { Router } from "express";
import { reportJobsController } from "../../controllers/report/reportJobs.controller";

export const reportJobsRoutes = Router();

reportJobsRoutes.post("/sync", reportJobsController.syncJobs);
