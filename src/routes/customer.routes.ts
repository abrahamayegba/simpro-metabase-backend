import { Router } from "express";
import { customerSyncController } from "../controllers/customer.controller";

export const customerSyncRoutes = Router();

// No archived customers
customerSyncRoutes.post("/sync", customerSyncController.syncActiveCustomers);

// User decides whether archived customers are included
customerSyncRoutes.post("/sync/all", customerSyncController.syncCustomers);
