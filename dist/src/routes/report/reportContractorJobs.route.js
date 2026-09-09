"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportContractorJobsRoutes = void 0;
const express_1 = require("express");
const reportContractorJobs_controller_1 = require("../../controllers/report/reportContractorJobs.controller");
exports.reportContractorJobsRoutes = (0, express_1.Router)();
exports.reportContractorJobsRoutes.post("/sync", reportContractorJobs_controller_1.reportContractorJobsController.syncContractorJobs);
