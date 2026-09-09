"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerSyncRoutes = void 0;
const express_1 = require("express");
const customer_controller_1 = require("../controllers/customer.controller");
exports.customerSyncRoutes = (0, express_1.Router)();
// No archived customers
exports.customerSyncRoutes.post("/sync", customer_controller_1.customerSyncController.syncActiveCustomers);
// User decides whether archived customers are included
exports.customerSyncRoutes.post("/sync/all", customer_controller_1.customerSyncController.syncCustomers);
