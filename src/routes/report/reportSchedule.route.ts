import { Router } from "express";
import { reportSchedulesController } from "../../controllers/report/reportSchedules.controller";

export const reportSchedulesRoutes = Router();

reportSchedulesRoutes.post("/sync", reportSchedulesController.syncSchedules);
