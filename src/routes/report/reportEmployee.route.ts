import { Router } from "express";
import { reportEmployeesController } from "../../controllers/report/reportEmployee.controller";

export const reportEmployeesRoutes = Router();

reportEmployeesRoutes.post("/sync", reportEmployeesController.syncEmployees);
