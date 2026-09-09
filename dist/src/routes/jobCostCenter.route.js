"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobCostCenterSyncRoutes = void 0;
const express_1 = require("express");
const jobCostCenter_controller_1 = require("../controllers/jobCostCenter.controller");
exports.jobCostCenterSyncRoutes = (0, express_1.Router)();
// No archived customers
exports.jobCostCenterSyncRoutes.post("/sync", jobCostCenter_controller_1.jobCostCenterSyncController.syncJobCostCenters);
