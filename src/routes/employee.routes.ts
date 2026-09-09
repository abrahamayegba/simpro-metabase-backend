import { Router } from "express";
import { employeeSyncController } from "../controllers/employee.controller";

export const employeeSyncRoutes = Router();

// No archived employees
employeeSyncRoutes.post("/sync", employeeSyncController.syncActiveEmployees);

// User decides whether archived employees are included
employeeSyncRoutes.post("/sync/all", employeeSyncController.syncEmployees);
