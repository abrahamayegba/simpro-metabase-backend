import { Router } from "express";
import { reportCustomersController } from "../../controllers/report/reportCustomers.controller";

export const reportCustomersRoutes = Router();

reportCustomersRoutes.post("/sync", reportCustomersController.syncCustomers);

reportCustomersRoutes.get("/sync/:syncId", reportCustomersController.getSyncStatus);
