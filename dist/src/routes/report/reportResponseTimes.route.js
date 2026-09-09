"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportResponseTimesRoutes = void 0;
const express_1 = require("express");
const reportResponseTimes_controller_1 = require("../../controllers/report/reportResponseTimes.controller");
exports.reportResponseTimesRoutes = (0, express_1.Router)();
exports.reportResponseTimesRoutes.post("/sync", reportResponseTimes_controller_1.reportResponseTimesController.syncResponseTimes);
