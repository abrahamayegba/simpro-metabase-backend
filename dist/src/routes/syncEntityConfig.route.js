"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const syncEntityConfig_controller_1 = require("../controllers/syncEntityConfig.controller");
const SyncEntityConfigRouter = (0, express_1.Router)();
SyncEntityConfigRouter.get("/entities/:companyId", syncEntityConfig_controller_1.syncEntityConfigController.getEntities);
exports.default = SyncEntityConfigRouter;
