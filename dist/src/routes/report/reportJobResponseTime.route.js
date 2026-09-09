"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportJobResponseTimesRoutes = void 0;
const express_1 = require("express");
const reportJobResponseTimes_controller_1 = require("../../controllers/report/reportJobResponseTimes.controller");
exports.reportJobResponseTimesRoutes = (0, express_1.Router)();
// Import job response time CSV snapshot
exports.reportJobResponseTimesRoutes.post("/import", reportJobResponseTimes_controller_1.reportJobResponseTimesController.importJobResponseTimes);
