"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeSyncRoutes = void 0;
const express_1 = require("express");
const employee_controller_1 = require("../controllers/employee.controller");
exports.employeeSyncRoutes = (0, express_1.Router)();
// No archived employees
exports.employeeSyncRoutes.post("/sync", employee_controller_1.employeeSyncController.syncActiveEmployees);
// User decides whether archived employees are included
exports.employeeSyncRoutes.post("/sync/all", employee_controller_1.employeeSyncController.syncEmployees);
