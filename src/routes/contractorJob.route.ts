import { Router } from "express";
import { contractorJobSyncController } from "../controllers/contractorJob.controller";

export const contractorJobSyncRoutes = Router();

// No archived customers
contractorJobSyncRoutes.post("/sync", contractorJobSyncController.syncContractorJobs);