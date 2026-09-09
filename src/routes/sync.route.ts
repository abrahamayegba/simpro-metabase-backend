import { Router } from "express";
import { syncController } from "../controllers/sync.controller";

const getDashboardRouter = Router();

getDashboardRouter.get("/dashboard/:companyId", syncController.getDashboard);
getDashboardRouter.get("/active/:companyId", syncController.getActive);
getDashboardRouter.get("/:syncId", syncController.getById);
getDashboardRouter.post("/:syncId/cancel", syncController.cancel);

export default getDashboardRouter;
