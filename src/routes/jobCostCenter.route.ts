import { Router } from "express";
import { jobCostCenterSyncController } from "../controllers/jobCostCenter.controller";

export const jobCostCenterSyncRoutes = Router();

// No archived customers
jobCostCenterSyncRoutes.post("/sync", jobCostCenterSyncController.syncJobCostCenters);
