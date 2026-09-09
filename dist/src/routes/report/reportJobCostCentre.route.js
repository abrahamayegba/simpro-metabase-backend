"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportJobCostCentresRoutes = void 0;
const express_1 = require("express");
const reportJobCostCentres_controller_1 = require("../../controllers/report/reportJobCostCentres.controller");
exports.reportJobCostCentresRoutes = (0, express_1.Router)();
exports.reportJobCostCentresRoutes.post("/sync", reportJobCostCentres_controller_1.reportJobCostCentresController.syncJobCostCentres);
