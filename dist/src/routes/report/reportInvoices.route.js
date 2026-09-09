"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportInvoicesRoutes = void 0;
const express_1 = require("express");
const reportInvoices_controller_1 = require("../../controllers/report/reportInvoices.controller");
exports.reportInvoicesRoutes = (0, express_1.Router)();
exports.reportInvoicesRoutes.post("/sync", reportInvoices_controller_1.reportInvoicesController.syncInvoices);
