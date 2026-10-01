"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportSchedulesRoutes = void 0;
const express_1 = require("express");
const reportSchedules_controller_1 = require("../../controllers/report/reportSchedules.controller");
exports.reportSchedulesRoutes = (0, express_1.Router)();
exports.reportSchedulesRoutes.post("/sync", reportSchedules_controller_1.reportSchedulesController.syncSchedules);
