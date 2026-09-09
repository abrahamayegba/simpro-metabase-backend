import { Router } from "express";
import { siteSyncController } from "../controllers/site.controller";

export const siteSyncRoutes = Router();

// No archived customers
siteSyncRoutes.post("/sync", siteSyncController.syncActiveSites);

// User decides whether archived customers are included
siteSyncRoutes.post("/sync/all", siteSyncController.syncSites);