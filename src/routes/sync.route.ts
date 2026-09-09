import { Router } from "express";
import { syncController } from "../controllers/sync.controller";

const getDashboardRouter = Router();

getDashboardRouter.get("/dashboard/:companyId", syncController.getDashboard);

export default getDashboardRouter;
