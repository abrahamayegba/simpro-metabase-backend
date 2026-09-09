import { Router } from "express";
import { syncEntityConfigController } from "../controllers/syncEntityConfig.controller";

const SyncEntityConfigRouter = Router();

SyncEntityConfigRouter.get(
  "/entities/:companyId",
  syncEntityConfigController.getEntities,
);

export default SyncEntityConfigRouter;
