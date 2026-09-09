import { Router } from "express";
import { quoteSyncController } from "../controllers/quote.controller";

export const quoteSyncRoutes = Router();

// No archived customers
quoteSyncRoutes.post("/sync", quoteSyncController.syncActiveQuotes);

// User decides whether archived customers are included
quoteSyncRoutes.post("/sync/all", quoteSyncController.syncQuotes);