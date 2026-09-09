import { Router } from "express";
import { jobSyncController } from "../controllers/job.controller";

export const jobSyncRoutes = Router();
// User decides whether archived jobs are included
jobSyncRoutes.post("/sync/all", jobSyncController.syncJobs);
