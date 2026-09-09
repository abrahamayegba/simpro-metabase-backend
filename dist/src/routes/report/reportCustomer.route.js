"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportCustomersRoutes = void 0;
const express_1 = require("express");
const reportCustomers_controller_1 = require("../../controllers/report/reportCustomers.controller");
exports.reportCustomersRoutes = (0, express_1.Router)();
exports.reportCustomersRoutes.post("/sync", reportCustomers_controller_1.reportCustomersController.syncCustomers);
exports.reportCustomersRoutes.get("/sync/:syncId", reportCustomers_controller_1.reportCustomersController.getSyncStatus);
