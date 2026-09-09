"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportJobsRoutes = void 0;
const express_1 = require("express");
const reportJobs_controller_1 = require("../../controllers/report/reportJobs.controller");
exports.reportJobsRoutes = (0, express_1.Router)();
exports.reportJobsRoutes.post("/sync", reportJobs_controller_1.reportJobsController.syncJobs);
