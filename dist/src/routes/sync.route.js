"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sync_controller_1 = require("../controllers/sync.controller");
const getDashboardRouter = (0, express_1.Router)();
getDashboardRouter.get("/dashboard/:companyId", sync_controller_1.syncController.getDashboard);
exports.default = getDashboardRouter;
