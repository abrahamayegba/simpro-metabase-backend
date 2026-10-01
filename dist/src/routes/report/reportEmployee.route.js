"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportEmployeesRoutes = void 0;
const express_1 = require("express");
const reportEmployee_controller_1 = require("../../controllers/report/reportEmployee.controller");
exports.reportEmployeesRoutes = (0, express_1.Router)();
exports.reportEmployeesRoutes.post("/sync", reportEmployee_controller_1.reportEmployeesController.syncEmployees);
